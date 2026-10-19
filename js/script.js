// js/script.js - Dashboard Metrics Sync
const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardMetrics();
});

async function loadDashboardMetrics() {
    const custElem = document.getElementById("statCustomers");
    const ordersElem = document.getElementById("statOrders");
    const lowStockElem = document.getElementById("statLowStock");

    try {
        // 1. Fetch Orders to derive total orders and unique customers
        const ordersRes = await fetch(`${API_BASE_URL}/orders`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });

        if (ordersRes.ok) {
            const orders = await ordersRes.json();
            
            // Total Orders Count
            if (ordersElem) {
                ordersElem.textContent = orders.length;
            }

            // Distinct Customers Count (or fetch /auth/users if configured)
            if (custElem) {
                const uniqueCustomerIds = new Set(orders.map(o => o.userId));
                custElem.textContent = uniqueCustomerIds.size || 1;
            }
        } else {
            if (ordersElem) ordersElem.textContent = "0";
            if (custElem) custElem.textContent = "0";
        }

        // 2. Fetch Materials to count items at or below low stock threshold
        const materialsRes = await fetch(`${API_BASE_URL}/materials`, {
            headers: { "ngrok-skip-browser-warning": "69420" }
        });

        if (materialsRes.ok) {
            const materials = await materialsRes.json();
            const lowStockCount = materials.filter(m => m.stockQuantity <= m.lowStockThreshold).length;
            
            if (lowStockElem) {
                lowStockElem.textContent = lowStockCount;
                if (lowStockCount > 0) {
                    lowStockElem.style.color = "#ff4444"; // Highlight in red if restock needed
                }
            }
        } else {
            if (lowStockElem) lowStockElem.textContent = "0";
        }

    } catch (error) {
        console.error("Error loading dashboard metrics:", error);
        if (custElem) custElem.textContent = "!";
        if (ordersElem) ordersElem.textContent = "!";
        if (lowStockElem) lowStockElem.textContent = "!";
    }
}