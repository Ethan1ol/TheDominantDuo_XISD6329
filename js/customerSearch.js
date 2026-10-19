// js/customerSearch.js - Customer Management & Walk-in Pipeline
const API_BASE_URL = "http://localhost:5000/api";

let loadedMaterials = [];
let allCustomersCache = [];

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial loads
    loadCustomers();
    loadMaterialsForWalkIn();

    // 2. Add customer form
    const addCustForm = document.getElementById("addCustomerForm");
    if (addCustForm) {
        addCustForm.addEventListener("submit", handleAddCustomer);
    }

    // 3. Search and Show All handlers
    const searchBtn = document.getElementById("searchCustomerBtn");
    const showAllBtn = document.getElementById("showAllCustomersBtn");
    const searchInput = document.getElementById("searchCustomerInput");

    if (searchBtn && searchInput) {
        searchBtn.addEventListener("click", () => filterCustomers(searchInput.value));
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") filterCustomers(searchInput.value);
        });
    }

    if (showAllBtn) {
        showAllBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            renderCustomerTable(allCustomersCache);
        });
    }

    // 4. Walk-in Order total calculation and submission
    const materialSelect = document.getElementById("walkInMaterialSelect");
    const qtyInput = document.getElementById("walkInQty");
    const walkInForm = document.getElementById("walkInOrderForm");

    if (materialSelect) materialSelect.addEventListener("change", updateWalkInTotal);
    if (qtyInput) qtyInput.addEventListener("input", updateWalkInTotal);
    if (walkInForm) walkInForm.addEventListener("submit", handleWalkInOrder);
});

// Fetch all registered users/customers
async function loadCustomers() {
    const tableBody = document.getElementById("customersTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/users`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });

        if (!response.ok) {
            // Fallback: If no /auth/users endpoint exists, try pulling distinct users from orders
            loadCustomersFromOrders();
            return;
        }

        allCustomersCache = await response.json();
        renderCustomerTable(allCustomersCache);
    } catch (err) {
        console.warn("Could not fetch /auth/users, trying fallback...", err);
        loadCustomersFromOrders();
    }
}

// Fallback to fetch client details from orders endpoint
async function loadCustomersFromOrders() {
    const tableBody = document.getElementById("customersTableBody");
    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });
        if (!response.ok) throw new Error("Orders API failed");

        const orders = await response.json();
        
        // Group by user id to form unique customer rows
        const map = new Map();
        orders.forEach(o => {
            if (!map.has(o.userId)) {
                map.set(o.userId, {
                    userId: o.userId,
                    fullName: `Customer #${o.userId}`,
                    email: `customer${o.userId}@legacies.co.za`,
                    phoneNumber: "082 555 0100",
                    role: "customer"
                });
            }
        });

        allCustomersCache = Array.from(map.values());
        renderCustomerTable(allCustomersCache);
    } catch (e) {
        console.error("Failed to load customers:", e);
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ff5555; padding: 20px;">
                        Could not load customer data. Check if your API is running at ${API_BASE_URL}.
                    </td>
                </tr>
            `;
        }
    }
}

function renderCustomerTable(customers) {
    const tableBody = document.getElementById("customersTableBody");
    if (!tableBody) return;

    if (!customers || customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #aaa; padding: 20px;">
                    No customers found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = customers.map(c => `
        <tr>
            <td><strong>#${c.userId || c.id}</strong></td>
            <td>${c.fullName || c.name || "N/A"}</td>
            <td>${c.phoneNumber || c.contact || "N/A"}</td>
            <td>${c.email || "N/A"}</td>
            <td><span class="role-badge">${(c.role || "customer").toUpperCase()}</span></td>
            <td>
                <button onclick="prefillWalkIn('${escapeHtml(c.fullName || '')}', '${escapeHtml(c.phoneNumber || '')}', '${escapeHtml(c.email || '')}')" 
                        style="background: #ff7700; color: #000; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 0.8rem; font-weight: bold;">
                    Order for Customer
                </button>
            </td>
        </tr>
    `).join("");
}

function filterCustomers(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
        renderCustomerTable(allCustomersCache);
        return;
    }
    const filtered = allCustomersCache.filter(c => 
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phoneNumber && c.phoneNumber.includes(q))
    );
    renderCustomerTable(filtered);
}

// Populate materials dropdown from API
async function loadMaterialsForWalkIn() {
    const select = document.getElementById("walkInMaterialSelect");
    if (!select) return;

    try {
        const response = await fetch(`${API_BASE_URL}/materials`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });
        if (!response.ok) throw new Error("Materials failed");

        loadedMaterials = await response.json();
        select.innerHTML = `<option value="">-- Choose Vinyl Material --</option>` +
            loadedMaterials.map(m => `
                <option value="${m.materialId}" data-price="${m.unitPrice}">
                    ${m.materialName} (${m.color}) - R ${Number(m.unitPrice).toFixed(2)}
                </option>
            `).join("");
    } catch (err) {
        console.error("Error loading materials:", err);
        select.innerHTML = `<option value="">Failed to load materials</option>`;
    }
}

function updateWalkInTotal() {
    const select = document.getElementById("walkInMaterialSelect");
    const qtyInput = document.getElementById("walkInQty");
    const totalDisplay = document.getElementById("walkInTotalDisplay");

    const selectedOption = select.options[select.selectedIndex];
    const unitPrice = selectedOption ? parseFloat(selectedOption.getAttribute("data-price") || 0) : 0;
    const qty = parseInt(qtyInput ? qtyInput.value : 1, 10) || 1;

    const total = unitPrice * qty;
    if (totalDisplay) {
        totalDisplay.textContent = `Total: R ${total.toFixed(2)}`;
    }
}

// Prefill walk-in card when clicking "Order for Customer"
window.prefillWalkIn = function(name, contact, email) {
    const nameField = document.getElementById("walkInName");
    const contactField = document.getElementById("walkInContact");
    const emailField = document.getElementById("walkInEmail");

    if (nameField) nameField.value = name;
    if (contactField) contactField.value = contact;
    if (emailField) emailField.value = email;

    nameField.scrollIntoView({ behavior: "smooth" });
};

// Add customer through API
async function handleAddCustomer(e) {
    e.preventDefault();

    const fullName = document.getElementById("custFullName").value.trim();
    const contact = document.getElementById("custContact").value.trim();
    const email = document.getElementById("custEmail").value.trim();
    const password = document.getElementById("custPassword").value;

    const payload = {
        fullName: fullName,
        email: email,
        phoneNumber: contact,
        password: password
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(`Customer ${fullName} added successfully to database!`);
            document.getElementById("addCustomerForm").reset();
            loadCustomers();
        } else {
            const data = await response.json();
            alert(`Failed to add customer: ${data.message || 'Error occurred'}`);
        }
    } catch (err) {
        console.error("Registration error:", err);
        alert("Network error connecting to API.");
    }
}

// Create walk-in order through API
async function handleWalkInOrder(e) {
    e.preventDefault();

    const select = document.getElementById("walkInMaterialSelect");
    const qtyInput = document.getElementById("walkInQty");
    const designInput = document.getElementById("walkInDesign");

    if (!select.value) {
        alert("Please pick a vinyl material first.");
        return;
    }

    const payload = {
        userId: 1, // Attaches to primary walk-in counter customer
        orderType: "walk-in",
        items: [
            {
                designName: designInput ? designInput.value : "Workshop Walk-in",
                materialId: parseInt(select.value, 10),
                quantity: parseInt(qtyInput ? qtyInput.value : 1, 10)
            }
        ]
    };

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (response.ok) {
            alert(`Walk-In Order Placed!\n\nOrder Ref: ${result.orderRef}\nTotal: R ${Number(result.total).toFixed(2)}`);
            document.getElementById("walkInOrderForm").reset();
            updateWalkInTotal();
        } else {
            alert(`Order creation failed: ${result.message || 'Error'}`);
        }
    } catch (err) {
        console.error("Order error:", err);
        alert("Failed to reach API server.");
    }
}

function escapeHtml(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}