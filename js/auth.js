/*
 * auth.js - the signed-in session in the browser, and page access rules.
 * Reference: MDN Web Docs (2025) Window: sessionStorage property - https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage
 * Reference: Jones, M., Bradley, J. and Sakimura, N. (2015) RFC 7519: JSON Web Token (JWT) - https://www.rfc-editor.org/rfc/rfc7519
 */
(function () {
  "use strict";
  const LSP = (window.LSP = window.LSP || {});
  const KEY = "lsp.session";

  /** Reads "exp" (seconds since 1970) from a JWT's payload. */
  function expiryMillis(token) {
    try {
      const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = JSON.parse(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=")));
      return typeof json.exp === "number" ? json.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /** Reads the stored session, or null. Removes it if it has expired. */
  function read() {
    let data = null;
    try { data = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch { data = null; }
    if (!data || !data.token) return null;
    const exp = expiryMillis(data.token);
    if (!exp || Date.now() >= exp - 30000) {
      LSP.log("Auth", "info", "Stored session has expired.");
      sessionStorage.removeItem(KEY);
      return null;
    }
    return data;
  }

  const STAFF_PAGES = ["dashboard.html", "orders.html", "customers.html", "inventory.html"];

  /** Only allow redirects to pages on this site (prevents open-redirect tricks via ?next=). */
  function safeNext(next, role) {
    if (!next || !/^[a-z_-]+\.html(\?[\w=&-]*)?$/i.test(next)) return null;
    if (role !== "admin" && STAFF_PAGES.includes(next.split("?")[0])) return null;
    return next;
  }

  LSP.session = {
    /** The current session {token, userId, fullName, email, role, phoneNumber}, or null. */
    current: read,

    /** The JWT, or null. */
    token() { const s = read(); return s ? s.token : null; },

    isAdmin() { const s = read(); return !!s && s.role === "admin"; },

    /** Saves a successful sign-in response from the API. */
    save(auth) {
      if (!auth || !auth.token || !auth.userId) throw new Error("The server sent an incomplete sign-in response.");
      sessionStorage.setItem(KEY, JSON.stringify({
        token: auth.token, userId: auth.userId, fullName: auth.fullName, email: auth.email,
        role: auth.role, phoneNumber: auth.phoneNumber || "",
      }));
      LSP.log("Auth", "info", `Signed in as user ${auth.userId} (${auth.role}).`);
    },

    /** The page to open after sign-in: ?next= if it's a page on this site, else by role. */
    homeFor(role, next) {
      return safeNext(next, role) || (role === "admin" ? "dashboard.html" : "customer_dashboard.html");
    },

    /** Signs out: clears the session and Google's auto-select, then goes to the home page. */
    signOut() {
      sessionStorage.removeItem(KEY);
      if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
      LSP.log("Auth", "info", "Signed out.");
      window.location.replace("index.html");
    },

    /** Called when the API rejects the token: clear it and go to login with the reason. */
    endAndRedirect(reason) {
      sessionStorage.removeItem(KEY);
      LSP.log("Auth", "warn", "Session rejected by the server; returning to login.");
      const page = window.location.pathname.split("/").pop() || "index.html";
      const params = new URLSearchParams({ reason: reason || "Your session has ended. Please sign in again.", next: page });
      window.location.replace(`login.html?${params}`);
    },

    /** Customer pages: any signed-in user, otherwise go to login. */
    requireSignedIn() {
      const s = read();
      if (!s) {
        const page = window.location.pathname.split("/").pop();
        LSP.log("Auth", "info", `Not signed in; redirecting ${page} to login.`);
        window.location.replace(`login.html?${new URLSearchParams({ next: page })}`);
        return null; // the page script stops when it gets null
      }
      return s;
    },

    /** Staff pages: admins only. Customers are sent to their own home page. Returns the session, or null. */
    requireAdmin() {
      const s = LSP.session.requireSignedIn();
      if (!s) return null;
      if (s.role !== "admin") {
        LSP.log("Auth", "warn", "Staff page opened by a customer account; redirecting.");
        window.location.replace("customer_dashboard.html");
        return null;
      }
      return s;
    },
  };
})();
