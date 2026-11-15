/* layout.js - draws the same header, navigation and footer on every page. */
(function () {
  "use strict";
  const LSP = (window.LSP = window.LSP || {});
  const { el } = LSP.dom;

  const NAV = {
    public: [["index.html", "Home"], ["index.html#track", "Track an order"]],
    customer: [["customer_dashboard.html", "Home"], ["customers_order.html", "Place order"], ["order_search.html", "My orders"]],
    staff: [["dashboard.html", "Dashboard"], ["orders.html", "Orders"], ["customers.html", "Customers"], ["inventory.html", "Inventory"]],
  };

  /** Builds the header for this page's portal, with the signed-in user's name and Sign out. */
  function renderHeader() {
    const header = document.getElementById("siteHeader");
    if (!header) return;
    const portal = document.body.dataset.portal || "public";
    const current = window.location.pathname.split("/").pop() || "index.html";
    const session = LSP.session.current();

    const links = (NAV[portal] || NAV.public).map(([href, label]) =>
      el("a", { text: label, attrs: { href, "aria-current": href === current ? "page" : null } }));

    const right = session
      ? el("div", { className: "user-chip" }, [
          el("span", {}, ["Signed in as ", el("strong", { text: session.fullName || session.email })]),
          // Shortcut between portals for staff, who can also use the customer pages.
          session.role === "admin" && portal !== "staff" ? el("a", { text: "Staff portal", attrs: { href: "dashboard.html" } }) : "",
          session.role !== "admin" && portal === "public" ? el("a", { text: "My account", attrs: { href: "customer_dashboard.html" } }) : "",
          el("button", { className: "button-small button-secondary", text: "Sign out", attrs: { type: "button" }, on: { click: LSP.session.signOut } }),
        ])
      : el("a", { className: "button button-small", text: "Sign in", attrs: { href: "login.html" } });

    header.className = "site-header";
    header.append(el("div", { className: "site-header__inner" }, [
      el("a", { className: "brand", attrs: { href: "index.html" } }, [
        el("img", { attrs: { src: "images/LegaciesSP_Image.jpg", alt: "" } }),
        el("span", { text: "Legacies Screen Printers" }),
      ]),
      el("nav", { className: "site-nav", attrs: { "aria-label": "Main" } }, links),
      right,
    ]));
  }

  /** Builds the footer with the privacy and account-deletion links required for Google Play. */
  function renderFooter() {
    const footer = document.getElementById("siteFooter");
    if (!footer) return;
    footer.className = "site-footer";
    footer.append(el("div", { className: "site-footer__inner" }, [
      el("span", { text: `© ${new Date().getFullYear()} Legacies Screen Printers. Print with purpose.` }),
      el("span", {}, [
        el("a", { text: "Privacy policy", attrs: { href: "privacy.html" } }), " · ",
        el("a", { text: "Delete my account", attrs: { href: "delete-account.html" } }),
      ]),
    ]));
  }

  renderHeader();
  renderFooter();
})();
