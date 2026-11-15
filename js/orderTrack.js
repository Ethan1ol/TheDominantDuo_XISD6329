/* orderTrack.js - shows one order's details and its production timeline. */
(function () {
  "use strict";
  const LSP = (window.LSP = window.LSP || {});
  const { el, clear, status } = LSP.dom;

  const STAGES = [
    ["Order Received & Verified", "Artwork and dimensions verified by prepress"],
    ["Vinyl Cutting & Screen Prep", "Precision plotter cutting vinyl & burning screens"],
    ["Screen Printing", "Multi-pass ink application & tunnel curing"],
    ["Ready for Collection", "Quality checked and packaged at the workshop counter"],
  ];

  /** Which timeline step (0-3) an API status is at. */
  function stageOf(statusText) {
    if (statusText === "Completed") return { index: 3, allDone: true };
    const index = STAGES.findIndex(([name]) => name === statusText);
    return { index: index < 0 ? 0 : index, allDone: false };
  }

  /** Renders an order (OrderDto from the API) into a container. */
  function render(container, order) {
    clear(container);
    const { index, allDone } = stageOf(order.status);

    const summary = el("div", { className: "order-summary" }, [
      el("div", {}, [el("span", { text: "Order reference" }), el("strong", { className: "ref", text: order.orderRef })]),
      el("div", {}, [el("span", { text: "Status" }), el("strong", { text: order.status })]),
      el("div", {}, [el("span", { text: "Placed" }), el("strong", { text: LSP.format.date(order.createdAt) })]),
      el("div", {}, [el("span", { text: "Total" }), el("strong", { text: LSP.format.money(order.totalAmount) })]),
      el("div", {}, [el("span", { text: "Customer" }), el("strong", { text: order.clientName || "-" })]),
      el("div", {}, [el("span", { text: "Placed via" }), el("strong", { text: LSP.format.orderType(order.orderType) })]),
    ]);

    const items = el("table", { className: "responsive" }, [
      el("thead", {}, [el("tr", {}, [
        el("th", { text: "Design" }), el("th", { text: "Material" }),
        el("th", { className: "num", text: "Qty" }), el("th", { className: "num", text: "Subtotal" }),
      ])]),
      el("tbody", {}, (order.items || []).map((item) => el("tr", {}, [
        el("td", { text: item.designName, attrs: { "data-label": "Design" } }),
        el("td", { text: item.materialName || "-", attrs: { "data-label": "Material" } }),
        el("td", { className: "num", text: item.quantity, attrs: { "data-label": "Qty" } }),
        el("td", { className: "num", text: LSP.format.money(item.subtotal), attrs: { "data-label": "Subtotal" } }),
      ]))),
    ]);

    const timeline = el("ol", { className: "timeline", attrs: { "aria-label": "Production stages" } },
      STAGES.map(([title, desc], i) => {
        const state = allDone || i < index ? "done" : i === index ? "current" : "";
        return el("li", { className: state, dataset: { step: i + 1 }, attrs: { "aria-current": state === "current" ? "step" : null } }, [
          el("strong", { text: `Stage ${i + 1}: ${title}` }),
          el("span", { text: desc }),
        ]);
      }));

    container.append(summary, el("div", { className: "table-wrap" }, [items]),
      el("h3", { className: "mt", text: "Production timeline" }), timeline);
  }

  /** Looks up an order by reference (public endpoint) and renders it. */
  async function trackByRef(ref, result, statusBox) {
    const reference = (ref || "").trim().toUpperCase();
    clear(result);
    if (!/^ORD\d{3,10}$/.test(reference)) {
      status(statusBox, "Enter an order reference like ORD123456.", "error");
      return;
    }
    status(statusBox, "Looking up your order...", "info");
    try {
      const order = await LSP.api.fetch(`/orders/track/${encodeURIComponent(reference)}`);
      status(statusBox, "");
      render(result, order);
      LSP.log("Track", "info", `Tracked ${reference}: ${order.status}`);
    } catch (e) {
      status(statusBox, e.status === 404 ? `No order found with reference ${reference}.` : e.message, "error");
    }
  }

  LSP.track = { render, trackByRef, stageOf };
})();
