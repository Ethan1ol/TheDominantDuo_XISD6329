/* customerOrder.js - the customer "Place an order" page. */
(function () {
  "use strict";
  const session = LSP.session.requireSignedIn();
  if (!session) return; // redirecting to login or the customer home page
  const { el, clear, status } = LSP.dom;

  const rowsBox = document.getElementById("designRows");
  const statusBox = document.getElementById("orderStatus");
  const placeBtn = document.getElementById("placeOrder");
  let materials = [];

  document.getElementById("custName").textContent = session.fullName;
  document.getElementById("custEmail").textContent = session.email;
  document.getElementById("custPhone").textContent = session.phoneNumber || "";

  /** Loads the material catalogue used by every design row's dropdown. */
  async function loadVinylOptions() {
    try {
      materials = await LSP.api.fetch("/materials");
      LSP.log("Orders", "debug", `Loaded ${materials.length} materials.`);
      addDesign();
    } catch (e) {
      status(statusBox, `Couldn't load materials: ${e.message}`, "error");
      placeBtn.disabled = true;
    }
  }

  /** Adds a design row (name, material, quantity, line total). */
  function addDesign() {
    const index = rowsBox.children.length + 1;
    const id = `d${Date.now()}${index}`;

    const select = el("select", { attrs: { id: `${id}-mat`, required: true } },
      materials.map((m) => el("option", {
        text: `${m.materialName} (${m.color}) - ${LSP.format.money(m.unitPrice)}/${m.unitMeasure}` + (m.stockQuantity <= 0 ? " - out of stock" : ""),
        attrs: { value: m.materialId, disabled: m.stockQuantity <= 0 },
      })));
    const qty = el("input", { attrs: { id: `${id}-qty`, type: "number", min: 1, step: 1, value: 1, required: true } });
    const name = el("input", { attrs: { id: `${id}-name`, type: "text", maxlength: 100, required: true, placeholder: "e.g. Team logo, front of shirt" } });
    const lineTotal = el("p", { className: "line-total" });

    const remove = el("button", {
      className: "button-link", text: "Remove", attrs: { type: "button", "aria-label": `Remove design ${index}` },
      on: { click: () => { row.remove(); renumber(); updateTotal(); } },
    });

    const row = el("div", { className: "design-row" }, [
      el("header", {}, [el("h3", { text: `Design ${index}` }), remove]),
      el("label", { text: "Design name or description", attrs: { for: name.id } }), name,
      el("div", { className: "form-row cols-3-1" }, [
        el("div", {}, [el("label", { text: "Vinyl material", attrs: { for: select.id } }), select]),
        el("div", {}, [el("label", { text: "Quantity", attrs: { for: qty.id } }), qty]),
      ]),
      lineTotal,
    ]);
    row._fields = { name, select, qty, lineTotal };

    select.addEventListener("change", updateTotal);
    qty.addEventListener("input", updateTotal);
    rowsBox.append(row);
    renumber();
    updateTotal();
    name.focus();
  }

  /** Keeps "Design 1, 2, 3..." headings correct after a row is removed; hides Remove on a lone row. */
  function renumber() {
    [...rowsBox.children].forEach((row, i) => {
      row.querySelector("h3").textContent = `Design ${i + 1}`;
      row.querySelector(".button-link").hidden = rowsBox.children.length === 1;
    });
  }

  /** Recalculates each line total and the order total from the catalogue prices. */
  function updateTotal() {
    let total = 0;
    [...rowsBox.children].forEach((row) => {
      const { select, qty, lineTotal } = row._fields;
      const material = materials.find((m) => String(m.materialId) === select.value);
      const quantity = Math.max(0, parseInt(qty.value, 10) || 0);
      const line = material ? material.unitPrice * quantity : 0;
      lineTotal.textContent = `${quantity} x ${LSP.format.money(material ? material.unitPrice : 0)} = ${LSP.format.money(line)}`;
      total += line;
    });
    document.getElementById("orderTotal").textContent = LSP.format.money(total);
  }

  /** Validates the rows and returns the API items, or null (with a message) if something is missing. */
  function collectItems() {
    const items = [];
    for (const [i, row] of [...rowsBox.children].entries()) {
      const { name, select, qty } = row._fields;
      const quantity = parseInt(qty.value, 10);
      if (!name.value.trim()) { status(statusBox, `Design ${i + 1}: enter a design name.`, "error"); name.focus(); return null; }
      if (!select.value) { status(statusBox, `Design ${i + 1}: choose a material.`, "error"); select.focus(); return null; }
      if (!quantity || quantity < 1) { status(statusBox, `Design ${i + 1}: quantity must be at least 1.`, "error"); qty.focus(); return null; }
      items.push({ designName: name.value.trim(), materialId: Number(select.value), quantity });
    }
    return items;
  }

  /** Sends the order to the API and shows the confirmed reference and total. */
  async function placeOrder() {
    const items = collectItems();
    if (!items) return;

    placeBtn.disabled = true;
    status(statusBox, "Placing your order...", "info");
    try {
      const result = await LSP.api.fetch("/orders", { method: "POST", body: { orderType: "web", items } });
      LSP.log("Orders", "info", `Order ${result.orderRef} placed, total ${result.total}.`);
      clear(rowsBox);
      addDesign();
      clear(statusBox);
      statusBox.className = "status success";
      statusBox.append(
        `Order placed! Your reference is ${result.orderRef} (total ${LSP.format.money(result.total)}). `,
        el("a", { text: "Track it", attrs: { href: `order_search.html?ref=${encodeURIComponent(result.orderRef)}` } }),
      );
    } catch (e) {
      // e.g. 409 "Not enough ... in stock"
      status(statusBox, e.message, "error");
    } finally {
      placeBtn.disabled = false;
    }
  }

  document.getElementById("addDesign").addEventListener("click", addDesign);
  placeBtn.addEventListener("click", placeOrder);
  loadVinylOptions();
})();
