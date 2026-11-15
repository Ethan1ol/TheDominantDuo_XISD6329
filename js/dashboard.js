/* dashboard.js - staff dashboard: customer count, orders still in production, low-stock count. */
(function () {
  "use strict";
  if (!LSP.session.requireAdmin()) return; // redirecting to login or the customer home page
  const { el, clear, status, emptyRow } = LSP.dom;

  /** Loads users, orders and materials in parallel and fills in the cards and table. */
  async function loadDashboard() {
    const recent = document.getElementById("recentBody");
    clear(recent);
    recent.append(emptyRow(6, "Loading..."));
    try {
      const [users, orders, materials] = await Promise.all([
        LSP.api.fetch("/users"), LSP.api.fetch("/orders"), LSP.api.fetch("/materials"),
      ]);

      const customers = users.filter((u) => u.role === "customer").length;
      const open = orders.filter((o) => o.status !== "Completed").length;
      const low = materials.filter((m) => m.stockQuantity <= m.lowStockThreshold).length;

      document.getElementById("statCustomers").textContent = customers;
      document.getElementById("statOpen").textContent = open;
      const lowEl = document.getElementById("statLowStock");
      lowEl.textContent = low;
      lowEl.classList.toggle("warn", low > 0);

      clear(recent);
      if (!orders.length) recent.append(emptyRow(6, "No orders yet."));
      orders.slice(0, 6).forEach((o) => recent.append(el("tr", {}, [
        el("td", { attrs: { "data-label": "Reference" } }, [el("span", { className: "ref", text: o.orderRef })]),
        el("td", { text: o.clientName, attrs: { "data-label": "Customer" } }),
        el("td", { text: LSP.format.orderType(o.orderType), attrs: { "data-label": "Via" } }),
        el("td", { text: o.status, attrs: { "data-label": "Status" } }),
        el("td", { className: "num", text: LSP.format.money(o.totalAmount), attrs: { "data-label": "Total" } }),
        el("td", { text: LSP.format.date(o.createdAt), attrs: { "data-label": "Placed" } }),
      ])));
      LSP.log("Dashboard", "info", `customers=${customers} open=${open} lowStock=${low}`);
    } catch (e) {
      clear(recent);
      recent.append(emptyRow(6, "Couldn't load dashboard data."));
      status(document.getElementById("dashStatus"), e.message, "error");
    }
  }

  loadDashboard();
})();
