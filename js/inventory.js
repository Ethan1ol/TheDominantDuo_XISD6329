/* inventory.js - staff Inventory page: stock table with low-stock flags, stock adjustments and adding materials. */
(function () {
  "use strict";
  if (!LSP.session.requireAdmin()) return; // redirecting to login or the customer home page
  const { el, clear, status, emptyRow } = LSP.dom;

  const body = document.getElementById("inventoryBody");
  const statusBox = document.getElementById("inventoryStatus");

  /** Loads the materials and draws the stock table. */
  async function fetchInventory() {
    clear(body);
    body.append(emptyRow(8, "Loading materials..."));
    try {
      const materials = await LSP.api.fetch("/materials");
      clear(body);
      if (!materials.length) body.append(emptyRow(8, "No materials yet. Add one below."));
      materials.forEach((m) => body.append(row(m)));
      const low = materials.filter((m) => m.stockQuantity <= m.lowStockThreshold);
      if (low.length) status(statusBox, `${low.length} material(s) at or below their alert level: ${low.map((m) => `${m.materialName} (${m.color})`).join(", ")}.`, "error");
      LSP.log("Inventory", "info", `Loaded ${materials.length} materials, ${low.length} low.`);
    } catch (e) {
      clear(body);
      body.append(emptyRow(8, "Couldn't load materials."));
      status(statusBox, e.message, "error");
    }
  }

  /** One material row with its own "adjust stock" control. */
  function row(m) {
    const isLow = m.stockQuantity <= m.lowStockThreshold;
    const change = el("input", { attrs: { type: "number", step: 1, placeholder: "+50 or -5", "aria-label": `Stock change for ${m.materialName} ${m.color}`, class: "stock-input" } });
    const apply = el("button", { className: "button-small", text: "Apply", attrs: { type: "button" } });
    apply.addEventListener("click", () => adjustStock(m, change, apply));
    change.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply.click(); } });

    return el("tr", {}, [
      el("td", { text: `#${m.materialId}`, attrs: { "data-label": "ID" } }),
      el("td", { text: m.materialName, attrs: { "data-label": "Material" } }),
      el("td", { text: m.color, attrs: { "data-label": "Colour" } }),
      el("td", { className: "num", text: LSP.format.money(m.unitPrice), attrs: { "data-label": "Price" } }),
      el("td", { className: "num", text: `${m.stockQuantity} ${m.unitMeasure}`, attrs: { "data-label": "In stock" } }),
      el("td", { className: "num", text: `${m.lowStockThreshold} ${m.unitMeasure}`, attrs: { "data-label": "Alert at" } }),
      el("td", { attrs: { "data-label": "Status" } }, [el("span", { className: isLow ? "badge low" : "badge ok", text: isLow ? "Low stock" : "In stock" })]),
      el("td", { attrs: { "data-label": "Adjust" } }, [el("div", { className: "actions inline-actions" }, [change, apply])]),
    ]);
  }

  /** Sends a stock change (+ delivery, - correction) and reloads the table. */
  async function adjustStock(material, input, button) {
    const changeBy = parseInt(input.value, 10);
    if (!changeBy) return status(statusBox, "Enter a whole number to add (e.g. 50) or remove (e.g. -5).", "error");
    button.disabled = true;
    try {
      const updated = await LSP.api.fetch(`/materials/${material.materialId}/stock`, { method: "PATCH", body: { change: changeBy } });
      LSP.log("Inventory", "info", `Material ${material.materialId} stock ${changeBy > 0 ? "+" : ""}${changeBy} -> ${updated.stockQuantity}.`);
      await fetchInventory();
      status(statusBox, `${updated.materialName} (${updated.color}) now has ${updated.stockQuantity} ${updated.unitMeasure}.`, "success");
    } catch (e) {
      status(statusBox, e.message, "error");
      button.disabled = false;
    }
  }

  /** Adds a new material from the form. */
  async function addMaterial(event) {
    event.preventDefault();
    const box = document.getElementById("addMaterialStatus");
    const body = {
      materialName: document.getElementById("matName").value.trim(),
      color: document.getElementById("matColor").value.trim(),
      unitMeasure: document.getElementById("matUnit").value.trim() || "meters",
      unitPrice: parseFloat(document.getElementById("matPrice").value),
      stockQuantity: parseInt(document.getElementById("matStock").value, 10) || 0,
      lowStockThreshold: parseInt(document.getElementById("matThreshold").value, 10) || 0,
    };
    if (!body.materialName || !body.color) return status(box, "Enter the material name and colour.", "error");
    if (!(body.unitPrice > 0)) return status(box, "Enter a price above zero.", "error");

    try {
      const created = await LSP.api.fetch("/materials", { method: "POST", body });
      LSP.log("Inventory", "info", `Material ${created.materialId} added.`);
      status(box, `${created.materialName} (${created.color}) added. Customers can order it now.`, "success");
      event.target.reset();
      document.getElementById("matUnit").value = "meters";
      document.getElementById("matThreshold").value = "15";
      fetchInventory();
    } catch (e) {
      status(box, e.message, "error");
    }
  }

  document.getElementById("addMaterialForm").addEventListener("submit", addMaterial);
  fetchInventory();
})();
