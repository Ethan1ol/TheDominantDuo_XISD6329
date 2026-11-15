/*
 * api.js - logging, safe DOM helpers, and the single function every page uses to call the API.
 * Reference: MDN Web Docs (2025) Using the Fetch API - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 * Reference: OWASP Foundation (2024) Cross Site Scripting Prevention Cheat Sheet - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 */
(function () {
  "use strict";
  const LSP = (window.LSP = window.LSP || {});

  /** Logs to the console with an [LSP/Area] prefix. Never log passwords or tokens. */
  LSP.log = function (area, level, ...parts) {
    const fn = console[level] || console.log;
    fn.call(console, `[LSP/${area}]`, ...parts);
  };

  // ---------- DOM helpers ----------

  LSP.dom = {
    /** Creates an element safely. */
    el(tag, props = {}, children = []) {
      const node = document.createElement(tag);
      if (props.className) node.className = props.className;
      if (props.text !== undefined && props.text !== null) node.textContent = String(props.text);
      Object.entries(props.attrs || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? "" : String(v)); });
      Object.entries(props.dataset || {}).forEach(([k, v]) => { node.dataset[k] = String(v); });
      Object.entries(props.on || {}).forEach(([evt, fn]) => node.addEventListener(evt, fn));
      children.forEach((c) => node.append(c instanceof Node ? c : document.createTextNode(String(c))));
      return node;
    },

    /** Removes all children of an element. */
    clear(node) { while (node.firstChild) node.removeChild(node.firstChild); },

    /** Shows an inline status message (replaces alert()). */
    status(node, message, kind = "info") {
      if (!node) return;
      node.className = `status ${kind}`;
      node.textContent = message || "";
    },

    /** A single full-width table row with a message, e.g. "Loading..." or "No orders yet". */
    emptyRow(colspan, message) {
      return LSP.dom.el("tr", { className: "empty-row" }, [LSP.dom.el("td", { text: message, attrs: { colspan } })]);
    },
  };

  // ---------- Formatting ----------

  LSP.format = {
    /** "R 1,234.50" - same style as the Android app (a dot for cents, whatever the browser's locale). */
    money(value) {
      return "R " + Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    /** API timestamps are UTC ISO-8601; show them in the viewer's local time, e.g. "15 Nov 2026, 19:51". */
    date(iso) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso || "";
      return d.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    },
    /** "mobile" -> "Mobile app", "web" -> "Website", "walk_in" -> "Walk-in". */
    orderType(type) {
      return { mobile: "Mobile app", web: "Website", walk_in: "Walk-in" }[type] || type || "";
    },
  };

  // ---------- API client ----------

  /** Error thrown for non-2xx responses; `status` is the HTTP code. */
  class ApiError extends Error {
    constructor(message, status, body) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.body = body;
    }
  }

  /** Builds a readable message from an API error body. */
  function messageFrom(body, status) {
    if (body && typeof body === "object") {
      if (body.message) return body.message;
      if (body.errors) {
        // ASP.NET validation problem details: { errors: { Field: ["msg", ...] } }
        const first = Object.values(body.errors).flat()[0];
        if (first) return first;
      }
      if (body.title) return body.title;
    }
    if (status === 0) return "Can't reach the server. Check your connection and try again.";
    if (status === 403) return "You don't have permission to do that.";
    if (status >= 500) return "The server had a problem. Please try again shortly.";
    return `Request failed (error ${status}).`;
  }

  LSP.api = {
    ApiError,

    /** Calls the API and returns the parsed JSON body (or null for empty responses). */
    async fetch(path, { method = "GET", body, auth = true } = {}) {
      const headers = { Accept: "application/json" };
      if (body !== undefined) headers["Content-Type"] = "application/json";

      const token = auth && LSP.session ? LSP.session.token() : null;
      if (token) headers.Authorization = `Bearer ${token}`;

      const url = window.LSP_CONFIG.apiBaseUrl + path;
      LSP.log("Api", "debug", method, path);

      let response;
      try {
        response = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
      } catch (networkError) {
        LSP.log("Api", "error", `Network error on ${method} ${path}:`, networkError.message);
        throw new ApiError(messageFrom(null, 0), 0, null);
      }

      const text = await response.text();
      let data = null;
      if (text) {
        try { data = JSON.parse(text); } catch { data = text; }
      }

      if (!response.ok) {
        LSP.log("Api", "warn", `${method} ${path} -> HTTP ${response.status}`);
        // A signed-in request was rejected: the session is over (expired, invalid or revoked).
        if (response.status === 401 && token && LSP.session) {
          LSP.session.endAndRedirect(messageFrom(data, 401));
        }
        throw new ApiError(messageFrom(data, response.status), response.status, data);
      }
      return data;
    },
  };
})();
