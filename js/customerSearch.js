/*
 * customerSearch.js - staff Customers page.
 * Reference: MDN Web Docs (2025) Crypto: getRandomValues() method - https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
(function () {
  "use strict";
  if (!LSP.session.requireAdmin()) return; // redirecting to login or the customer home page
  const { el, clear, status, emptyRow } = LSP.dom;

  const tableBody = document.getElementById("customersTableBody");
  const customerSelect = document.getElementById("walkInCustomer");
  const materialSelect = document.getElementById("walkInMaterialSelect");
  const qtyInput = document.getElementById("walkInQty");
  let users = [];
  let materials = [];

  // ---------- Customer list ----------

  /** Loads all accounts and refreshes the table and the walk-in customer dropdown. */
  async function loadCustomers() {
    clear(tableBody);
    tableBody.append(emptyRow(7, "Loading customers..."));
    try {
      users = await LSP.api.fetch("/users");
      LSP.log("Customers", "info", `Loaded ${users.length} accounts.`);
      renderTable(users);
      fillCustomerSelect();
    } catch (e) {
      clear(tableBody);
      tableBody.append(emptyRow(7, "Couldn't load customers."));
      status(document.getElementById("listStatus"), e.message, "error");
    }
  }

  /** Draws the customer table. */
  function renderTable(list) {
    clear(tableBody);
    if (!list.length) { tableBody.append(emptyRow(7, "No customers match your search.")); return; }
    list.forEach((u) => tableBody.append(el("tr", {}, [
      el("td", { text: `#${u.userId}`, attrs: { "data-label": "ID" } }),
      el("td", { text: u.fullName, attrs: { "data-label": "Name" } }),
      el("td", { text: u.phoneNumber || "-", attrs: { "data-label": "Contact" } }),
      el("td", { text: u.email, attrs: { "data-label": "Email" } }),
      el("td", { attrs: { "data-label": "Role" } }, [el("span", { className: u.role === "admin" ? "badge accent" : "badge", text: u.role })]),
      el("td", { text: LSP.format.date(u.createdAt), attrs: { "data-label": "Joined" } }),
      el("td", {}, [el("button", {
        className: "button-small button-secondary", text: "New walk-in order", attrs: { type: "button" },
        on: { click: () => startWalkIn(u.userId) },
      })]),
    ])));
  }

  /** Filters the table as the user types (name, email or phone). */
  function filterCustomers() {
    const q = document.getElementById("searchCustomerInput").value.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    renderTable(!q ? users : users.filter((u) =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (digits && (u.phoneNumber || "").replace(/\D/g, "").includes(digits))));
  }

  // ---------- Add customer ----------

  /** Generates a readable 10-character temporary password using the browser's secure random source. */
  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    document.getElementById("custPassword").value = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  }

  async function handleAddCustomer(event) {
    event.preventDefault();
    const statusBox = document.getElementById("addStatus");
    const body = {
      fullName: document.getElementById("custFullName").value.trim(),
      phoneNumber: document.getElementById("custContact").value.trim(),
      email: document.getElementById("custEmail").value.trim(),
      password: document.getElementById("custPassword").value,
    };
    if (!body.fullName || !body.phoneNumber || !body.email) return status(statusBox, "Fill in name, contact number and email.", "error");
    if (body.password.length < 6) return status(statusBox, "The temporary password must be at least 6 characters (use Generate).", "error");

    try {
      // auth:false - registering must not send the staff member's own token.
      const created = await LSP.api.fetch("/auth/register", { method: "POST", body, auth: false });
      LSP.log("Customers", "info", `Customer ${created.userId} added.`);
      status(statusBox, `${created.fullName} added (customer #${created.userId}). Give them their temporary password.`, "success");
      event.target.reset();
      await loadCustomers();
      customerSelect.value = String(created.userId);
    } catch (e) {
      status(statusBox, e.message, "error");
    }
  }

  // ---------- Walk-in order ----------

  /** Fills the walk-in customer dropdown (customers first, then staff accounts). */
  function fillCustomerSelect() {
    const current = customerSelect.value;
    clear(customerSelect);
    customerSelect.append(el("option", { text: "Choose a customer...", attrs: { value: "" } }));
    [...users].sort((a, b) => (a.role === b.role ? a.fullName.localeCompare(b.fullName) : a.role === "customer" ? -1 : 1))
      .forEach((u) => customerSelect.append(el("option", {
        text: `${u.fullName} - ${u.phoneNumber || u.email}`, attrs: { value: u.userId },
      })));
    customerSelect.value = current;
  }

  /** Loads materials for the walk-in dropdown. */
  async function loadMaterials() {
    try {
      materials = await LSP.api.fetch("/materials");
      clear(materialSelect);
      materialSelect.append(el("option", { text: "Choose a material...", attrs: { value: "" } }));
      materials.forEach((m) => materialSelect.append(el("option", {
        text: `${m.materialName} (${m.color}) - ${LSP.format.money(m.unitPrice)} - ${m.stockQuantity} ${m.unitMeasure} left`,
        attrs: { value: m.materialId, disabled: m.stockQuantity <= 0 },
      })));
    } catch (e) {
      status(document.getElementById("walkInStatus"), `Couldn't load materials: ${e.message}`, "error");
    }
  }

  /** Shows the walk-in total from the selected material's price. */
  function updateWalkInTotal() {
    const m = materials.find((x) => String(x.materialId) === materialSelect.value);
    const qty = Math.max(0, parseInt(qtyInput.value, 10) || 0);
    document.getElementById("walkInTotalDisplay").textContent = LSP.format.money(m ? m.unitPrice * qty : 0);
  }

  /** From the table's "New walk-in order" button: preselect the customer and jump to the form. */
  function startWalkIn(userId) {
    customerSelect.value = String(userId);
    document.getElementById("walkInCard").scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("walkInDesign").focus({ preventScroll: true });
  }

  async function handleWalkInOrder(event) {
    event.preventDefault();
    const statusBox = document.getElementById("walkInStatus");
    const userId = Number(customerSelect.value);
    const designName = document.getElementById("walkInDesign").value.trim();
    const materialId = Number(materialSelect.value);
    const quantity = parseInt(qtyInput.value, 10);

    if (!userId) return status(statusBox, "Choose the customer this order is for.", "error");
    if (!designName) return status(statusBox, "Enter a design name.", "error");
    if (!materialId) return status(statusBox, "Choose a material.", "error");
    if (!quantity || quantity < 1) return status(statusBox, "Quantity must be at least 1.", "error");

    try {
      const result = await LSP.api.fetch("/orders", {
        method: "POST",
        body: { userId, orderType: "walk_in", items: [{ designName, materialId, quantity }] },
      });
      LSP.log("Orders", "info", `Walk-in order ${result.orderRef} for user ${userId}.`);
      status(statusBox, `Walk-in order ${result.orderRef} created - total ${LSP.format.money(result.total)}. The customer can track it with this reference.`, "success");
      event.target.reset();
      await loadMaterials(); // stock has changed
      updateWalkInTotal();
    } catch (e) {
      status(statusBox, e.message, "error");
    }
  }

  // ---------- Wire up ----------

  document.getElementById("addCustomerForm").addEventListener("submit", handleAddCustomer);
  document.getElementById("generatePassword").addEventListener("click", generatePassword);
  document.getElementById("walkInOrderForm").addEventListener("submit", handleWalkInOrder);
  materialSelect.addEventListener("change", updateWalkInTotal);
  qtyInput.addEventListener("input", updateWalkInTotal);
  document.getElementById("searchCustomerInput").addEventListener("input", filterCustomers);
  document.getElementById("showAllCustomersBtn").addEventListener("click", () => {
    document.getElementById("searchCustomerInput").value = "";
    renderTable(users);
  });

  generatePassword();
  loadCustomers();
  loadMaterials();
})();
