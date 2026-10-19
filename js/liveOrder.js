// js/liveOrder.js - Orders Management & Status Progression
const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Load orders immediately
    loadAllOrders();

    // 2. Wire refresh button
    const refreshBtn = document.getElementById("refreshOrdersBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", loadAllOrders);
    }
});

async function loadAllOrders() {
    const tableBody = document.getElementById("ordersBody") || document.querySelector("#ordersTable tbody");
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; color: #888; padding: 25px;">
                Fetching active orders from database...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            headers: {
                "ngrok-skip-browser-warning": "69420"
            }
        });

        if (!response.ok) {
            throw new Error(`API returned HTTP ${response.status}`);
        }

        const orders = await response.json();
        tableBody.innerHTML = "";

        if (!orders || orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #aaa; padding: 30px;">
                        No orders recorded in database yet.
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement("tr");
            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Today";
            const orderType = order.orderType || "mobile";

            row.innerHTML = `
                <td><strong style="color: #ff9933; font-size: 1rem;">${order.orderRef}</strong></td>
                <td>User #${order.userId}</td>
                <td><span class="type-badge">${orderType}</span></td>
                <td><strong>R ${Number(order.totalAmount).toFixed(2)}</strong></td>
                <td>
                    <select class="status-select" onchange="updateStage(${order.orderId}, this.value)">
                        <option value="Order Received & Verified" ${order.status === 'Order Received & Verified' ? 'selected' : ''}>1. Order Received & Verified</option>
                        <option value="Vinyl Cutting & Screen Prep" ${order.status === 'Vinyl Cutting & Screen Prep' ? 'selected' : ''}>2. Vinyl Cutting & Screen Prep</option>
                        <option value="Screen Printing" ${order.status === 'Screen Printing' ? 'selected' : ''}>3. Screen Printing</option>
                        <option value="Ready for Collection" ${order.status === 'Ready for Collection' ? 'selected' : ''}>4. Ready for Collection</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>5. Completed</option>
                    </select>
                </td>
                <td style="color: #888;">${dateStr}</td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading orders:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #ff5555; padding: 25px;">
                    Failed to connect to API at ${API_BASE_URL}.<br>
                    <small style="color: #888;">Ensure your ASP.NET Core terminal ('dotnet run') is active on port 5000.</small>
                </td>
            </tr>
        `;
    }
}

// Update order stage directly in the SQL database
window.updateStage = async function(orderId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "69420"
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            console.log(`Order #${orderId} stage updated to: ${newStatus}`);
        } else {
            alert("Failed to update status on server.");
            loadAllOrders(); // Revert back to original on failure
        }
    } catch (err) {
        console.error("Failed to update status:", err);
        alert("Network error connecting to API.");
    }
};