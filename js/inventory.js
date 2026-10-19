// js/inventory.js - Legacies Screen Printers Inventory Management
const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    loadInventory();
});

async function loadInventory() {
    const tableBody = document.getElementById("inventoryBody") || document.querySelector("#inventoryTable tbody");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/materials`, {
            headers: {
                "ngrok-skip-browser-warning": "69420"
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load materials: ${response.statusText}`);
        }

        const materials = await response.json();
        tableBody.innerHTML = "";

        if (materials.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #ffaa00; padding: 20px;">
                        No materials found in database.
                    </td>
                </tr>
            `;
            return;
        }

        materials.forEach(mat => {
            const isLowStock = mat.stockQuantity <= mat.lowStockThreshold;
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>#${mat.materialId}</td>
                <td><strong>${mat.materialName}</strong></td>
                <td><span style="color: #bbb;">${mat.color}</span></td>
                <td><strong>R ${Number(mat.unitPrice).toFixed(2)}</strong></td>
                <td>
                    <span style="color: ${isLowStock ? '#e74c3c' : '#2ecc71'}; font-weight: bold;">
                        ${mat.stockQuantity} ${mat.unitMeasure}
                    </span>
                </td>
                <td style="color: #888;">${mat.lowStockThreshold} ${mat.unitMeasure}</td>
                <td>
                    ${isLowStock 
                        ? '<span class="badge badge-lowstock">Low Stock</span>' 
                        : '<span class="badge badge-instock">In Stock</span>'}
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error loading inventory:", error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #e74c3c; padding: 25px;">
                    Failed to connect to API at ${API_BASE_URL}.<br>
                    <small style="color: #888;">Make sure your API terminal ('dotnet run') is active on port 5000.</small>
                </td>
            </tr>
        `;
    }
}