/*
 * login.js - sign-in page logic: Google single sign-on, email/password sign-in, and registration.
 * Reference: Google (2025) Display the Sign in with Google button - https://developers.google.com/identity/gsi/web/guides/display-button
 * Reference: Google (2025) Handle credential responses with JavaScript functions - https://developers.google.com/identity/gsi/web/guides/handle-credential-responses-js-functions
 */
(function () {
  "use strict";
  const { el, status } = LSP.dom;
  const params = new URLSearchParams(window.location.search);
  const next = params.get("next");
  const statusBox = document.getElementById("loginStatus");

  // Already signed in? Go straight to the right home page.
  const existing = LSP.session.current();
  if (existing) {
    window.location.replace(LSP.session.homeFor(existing.role, next));
    return;
  }

  // Why the user was sent here, e.g. "Your session has expired. Please sign in again."
  status(document.getElementById("sessionMessage"), params.get("reason") || "", "info");

  /** Stores the API's sign-in response and opens the right page. */
  function completeSignIn(auth) {
    LSP.session.save(auth);
    status(statusBox, `Welcome, ${auth.fullName}!`, "success");
    window.location.replace(LSP.session.homeFor(auth.role, next));
  }

  /** Disables or re-enables a form's controls while a request is running. */
  function setBusy(form, busy) {
    form.querySelectorAll("input, button").forEach((c) => { c.disabled = busy; });
  }

  // ---------- Google sign-in ----------

  /** Called by Google with the signed-in account's ID token. */
  async function handleGoogleCredential(response) {
    status(statusBox, "Signing in with Google...", "info");
    try {
      const auth = await LSP.api.fetch("/auth/google", { method: "POST", body: { idToken: response.credential }, auth: false });
      LSP.log("Auth", "info", "Google sign-in accepted by the API.");
      completeSignIn(auth);
    } catch (e) {
      LSP.log("Auth", "warn", "Google sign-in failed:", e.message);
      status(statusBox, e.message, "error");
    }
  }

  /** Loads Google's script and draws the button, or explains why Google sign-in is unavailable. */
  function setUpGoogle() {
    const clientId = window.LSP_CONFIG.googleClientId;
    const googleStatus = document.getElementById("googleStatus");
    if (!clientId) {
      LSP.log("Auth", "warn", "googleClientId is empty in js/config.js; Google sign-in disabled.");
      status(googleStatus, "Google sign-in isn't set up on this site yet. Please use your email below.", "info");
      document.getElementById("googleButton").hidden = true;
      return;
    }
    const script = el("script", { attrs: { src: "https://accounts.google.com/gsi/client", async: true, defer: true } });
    script.addEventListener("load", () => {
      google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, auto_select: false });
      google.accounts.id.renderButton(document.getElementById("googleButton"),
        { theme: "filled_black", size: "large", shape: "pill", text: "signin_with", width: 320 });
      LSP.log("Auth", "debug", "Google button ready.");
    });
    script.addEventListener("error", () => status(googleStatus, "Couldn't load Google sign-in. Check your connection.", "error"));
    document.head.append(script);
  }

  // ---------- Email sign-in and registration ----------

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    if (!email || !password) return status(statusBox, "Enter your email address and password.", "error");

    setBusy(loginForm, true);
    status(statusBox, "Signing in...", "info");
    try {
      completeSignIn(await LSP.api.fetch("/auth/login", { method: "POST", body: { email, password }, auth: false }));
    } catch (e) {
      status(statusBox, e.message, "error");
      document.getElementById("password").value = "";
    } finally {
      setBusy(loginForm, false);
    }
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = {
      fullName: document.getElementById("regName").value.trim(),
      phoneNumber: document.getElementById("regPhone").value.trim(),
      email: document.getElementById("regEmail").value.trim(),
      password: document.getElementById("regPassword").value,
    };
    if (!body.fullName || !body.phoneNumber || !body.email) return status(statusBox, "Please fill in every field.", "error");
    if (body.password.length < 6) return status(statusBox, "Password must be at least 6 characters.", "error");

    setBusy(registerForm, true);
    status(statusBox, "Creating your account...", "info");
    try {
      completeSignIn(await LSP.api.fetch("/auth/register", { method: "POST", body, auth: false }));
    } catch (e) {
      status(statusBox, e.message, "error");
    } finally {
      setBusy(registerForm, false);
    }
  });

  /** Switches between the Sign in and Create account tabs. */
  function showTab(register) {
    loginForm.hidden = register;
    registerForm.hidden = !register;
    document.getElementById("tabSignIn").setAttribute("aria-selected", String(!register));
    document.getElementById("tabRegister").setAttribute("aria-selected", String(register));
    document.getElementById("authTitle").textContent = register ? "Create a customer account" : "Sign in to your account";
    status(statusBox, "");
  }
  document.getElementById("tabSignIn").addEventListener("click", () => showTab(false));
  document.getElementById("tabRegister").addEventListener("click", () => showTab(true));

  setUpGoogle();
})();
