/* myOrders.js - the customer "My orders" page. */
(function () {
  "use strict";
  if (!LSP.session.requireSignedIn()) return; // redirecting to login or the customer home page
  const { el, clear, status, emptyRow } = LSP.dom;

  const body = document.getElementById("ordersBody");
  const listStatus = document.getElementById("listStatus");
  let orders = [];

  /** Loads the customer's orders and fills the table. */
  async function loadOrders() {
    clear(body);
    body.append(emptyRow(6, "Loading your orders..."));
    try {
      orders = await LSP.api.fetch("/orders/mine");
      clear(body);
      status(listStatus, "");
      if (!orders.length) {
        body.append(emptyRow(6, "No orders yet. Place your first order from the Place order page."));
        return;
      }
      orders.forEach((o) => body.append(row(o)));
      LSP.log("Orders", "info", `Loaded ${orders.length} order(s).`);

      // Open the order from ?ref= (link from the confirmation message), else the newest.
      const wanted = new URLSearchParams(window.location.search).get("ref");
      showDetail(orders.find((o) => o.orderRef === wanted) || orders[0], !!wanted);
    } catch (e) {
      clear(body);
      body.append(emptyRow(6, "Couldn't load your orders."));
      status(listStatus, e.message, "error");
    }
  }

  /** One table row for an order. */
  function row(order) {
    return el("tr", {}, [
      el("td", { attrs: { "data-label": "Reference" } }, [el("span", { className: "ref", text: order.orderRef })]),
      el("td", { text: LSP.format.date(order.createdAt), attrs: { "data-label": "Placed" } }),
      el("td", { text: LSP.format.orderType(order.orderType), attrs: { "data-label": "Via" } }),
      el("td", { attrs: { "data-label": "Status" } }, [el("span", { className: order.status === "Completed" ? "badge ok" : "badge accent", text: order.status })]),
      el("td", { className: "num", text: LSP.format.money(order.totalAmount), attrs: { "data-label": "Total" } }),
      el("td", {}, [el("button", {
        className: "button-small button-secondary", text: "View progress",
        attrs: { type: "button" }, on: { click: () => showDetail(order, true) },
      })]),
    ]);
  }

  /** Draws the selected order's details and timeline. */
  function showDetail(order, scroll) {
    status(document.getElementById("detailStatus"), "");
    LSP.track.render(document.getElementById("detailBody"), order);
    if (scroll) document.getElementById("detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("refresh").addEventListener("click", loadOrders);
  loadOrders();
})();
