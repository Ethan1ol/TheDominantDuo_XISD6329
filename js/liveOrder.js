/* liveOrder.js - staff Orders page: list every order and change its production stage. */
(function () {
  "use strict";
  if (!LSP.session.requireAdmin()) return; // redirecting to login or the customer home page
  const { el, clear, status, emptyRow } = LSP.dom;

  const STATUSES = [
    "Order Received & Verified",
    "Vinyl Cutting & Screen Prep",
    "Screen Printing",
    "Ready for Collection",
    "Completed",
  ];

  const body = document.getElementById("ordersBody");
  const statusBox = document.getElementById("ordersStatus");
  const filterStatus = document.getElementById("filterStatus");
  const filterText = document.getElementById("filterText");
  let orders = [];

  /** Fetches all orders from the API, then draws the filtered table. */
  async function loadOrders() {
    clear(body);
    body.append(emptyRow(7, "Loading orders..."));
    try {
      orders = await LSP.api.fetch("/orders");
      LSP.log("Orders", "info", `Loaded ${orders.length} orders.`);
      draw();
    } catch (e) {
      clear(body);
      body.append(emptyRow(7, "Couldn't load orders."));
      status(statusBox, e.message, "error");
    }
  }

  /** Applies the status filter and search box, then rebuilds the table. */
  function draw() {
    const mode = filterStatus.value;
    const q = filterText.value.trim().toLowerCase();
    const shown = orders.filter((o) =>
      (mode === "all" || (mode === "open" ? o.status !== "Completed" : o.status === mode)) &&
      (!q || o.orderRef.toLowerCase().includes(q) || (o.clientName || "").toLowerCase().includes(q)));

    clear(body);
    if (!shown.length) body.append(emptyRow(7, orders.length ? "No orders match this filter." : "No orders yet."));
    shown.forEach((o) => body.append(row(o)));
  }

  /** One table row, with a stage dropdown that saves as soon as it changes. */
  function row(order) {
    const select = el("select", { attrs: { "aria-label": `Production stage for ${order.orderRef}` } },
      STATUSES.map((s, i) => el("option", { text: `${i + 1}. ${s}`, attrs: { value: s, selected: s === order.status } })));
    select.addEventListener("change", () => updateStage(order, select));

    const items = (order.items || []).map((i) => `${i.quantity} x ${i.designName}`).join(", ");
    return el("tr", {}, [
      el("td", { attrs: { "data-label": "Reference" } }, [el("span", { className: "ref", text: order.orderRef })]),
      el("td", { attrs: { "data-label": "Customer" } }, [order.clientName, el("br"), el("small", { className: "muted", text: order.contact })]),
      el("td", { attrs: { "data-label": "Via" } }, [el("span", { className: "badge", text: LSP.format.orderType(order.orderType) })]),
      el("td", { text: items, attrs: { "data-label": "Items" } }),
      el("td", { className: "num", text: LSP.format.money(order.totalAmount), attrs: { "data-label": "Total" } }),
      el("td", { attrs: { "data-label": "Stage" } }, [select]),
      el("td", { text: LSP.format.date(order.createdAt), attrs: { "data-label": "Placed" } }),
    ]);
  }

  /** Saves a new stage; on failure puts the dropdown back to the previous value. */
  async function updateStage(order, select) {
    const previous = order.status;
    select.disabled = true;
    try {
      const updated = await LSP.api.fetch(`/orders/${order.orderId}/status`, { method: "PUT", body: { status: select.value } });
      order.status = updated.status;
      status(statusBox, `${order.orderRef} moved to "${updated.status}". The customer sees this in the app and on the website.`, "success");
      LSP.log("Orders", "info", `${order.orderRef}: ${previous} -> ${updated.status}`);
      if (filterStatus.value !== "all") draw();
    } catch (e) {
      select.value = previous;
      status(statusBox, `Couldn't update ${order.orderRef}: ${e.message}`, "error");
    } finally {
      select.disabled = false;
    }
  }

  filterStatus.addEventListener("change", draw);
  filterText.addEventListener("input", draw);
  document.getElementById("refreshOrders").addEventListener("click", loadOrders);
  loadOrders();
})();
