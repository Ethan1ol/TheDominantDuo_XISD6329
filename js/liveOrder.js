// LIVE PRICE shows the live update of the prices of the work
function updatePrice(){
    let itemId =
    document.getElementById("itemSelect").value;
    
    let item =
    inventory.find(i => i.itemId === itemId);
    
    
    if(item){
        document.getElementById("unitPrice").innerText =
        "R" + item.price;
        
        updateTotal();
    }
}


//Updates the total amount of the order
function updateTotal(){
    let total = 0;
    let rows = document.querySelectorAll(".designRow");
    rows.forEach(row => {

        let vinyl =
        row.querySelector(".designVinyl").value;

        let qty =
        Number(row.querySelector(".designQty").value);

        let item =
        inventory.find(i => i.itemId === vinyl);
        
        if(item && qty > 0){
            total += item.price * qty;
        }
    });

    let totalBox =
    document.getElementById("orderTotal");
    
    if(totalBox){
        totalBox.innerText =
        "R" + total;
    }
}


// Edit Customer allows for editing of customer information done by the admin
function editCustomer(id){
    let customer = customers.find(c => c.customerId === id);
    if(!customer) return;

    let name = prompt("Name", customer.fullName);
    if(name === null) return;
    let contact = prompt("Contact", customer.contact);
    if(contact === null) return;
    let email = prompt("Email", customer.email);
    if(email === null) return;

    name = name.trim();
    contact = contact.trim();
    email = email.trim();
    if(!name || !contact){
        alert("Name and contact are required.");
        return;
    }
    if(customers.some(entry => entry.customerId !== id && entry.contact === contact)){
        alert("A customer with this contact number already exists.");
        return;
    }

    customer.fullName = name;
    customer.contact = contact;
    customer.email = email;
    
    // UPDATE ORDERS LINKED TO THIS CUSTOMER
    orders.forEach(order=>{
        if(order.customerID === id){
            order.customerName = name;
            order.contact = contact;
        }
    });
    
    save();
    showCustomersTable();
    alert("Customer updated");
}

//this creates the walkin option
async function createWalkInOrder(){
    let result = createOrderFromInput({
        name: document.getElementById("walkName").value,
        contact: document.getElementById("walkContact").value,
        email: document.getElementById("walkEmail").value
    });
    if(!result.success){
        alert(result.message);
        return;
    }

    alert("Walk-in order created: " + result.order.orderID);
    document.getElementById("walkName").value = "";
    document.getElementById("walkContact").value = "";
    document.getElementById("walkEmail").value = "";
    document.querySelectorAll(".designName").forEach(input => input.value = "");
    document.querySelectorAll(".designQty").forEach(input => input.value = "");
    updateTotal();
}

//allows to admin to list it as a walk in
function loadWalkItems(){
    let select = document.getElementById("walkItem");
    
    if(!select) return;
    select.innerHTML="";
    
    inventory.forEach(i=>{
        let option = document.createElement("option");
        
        option.value = i.itemId;
        option.textContent = `${i.itemName} (Stock: ${i.stockLevel})`;
        
        select.appendChild(option);
    });
    
    updateWalkPrice();
}



let designCount = 1;
function addDesign(){
    
    designCount++;

    let container =
    document.getElementById("designContainer");

    let div =
    document.createElement("div");

    div.className = "designRow";
    div.innerHTML = `
    
    <h3>Design ${designCount}</h3>
    
    <input 
    class="designName"
    placeholder="Design Name">

    <input 
    type="file"
    class="designImage"
    accept="image/*">

    <h3>Material</h3>
    <select class="designVinyl">
    </select>

    <input 
    class="designQty"
    type="number"
    placeholder="Quantity"
    oninput="updateTotal()">
    
    <button onclick="removeDesign(this)">
    Remove
    </button>
    `;

    container.appendChild(div);
    loadVinylOptions();
}


//remove button from order
function removeDesign(button){

    let design =
    button.closest(".designRow");

    if(design){
        design.remove();
        updateTotal();
    }
}


function readImage(file){
    return new Promise(resolve=>{
        if(!file){
            resolve(null);
            return;
        }
        
        let reader =
        new FileReader();

        reader.onload = function(e){
            resolve(e.target.result);
        }
        reader.readAsDataURL(file);
    });
}

//Allows to choose from different vinyl options and select it
function loadVinylOptions(){
    let selects = document.querySelectorAll(".designVinyl");
    selects.forEach(select => {
        select.innerHTML = "";
        inventory.forEach(item => {
            let option = document.createElement("option");
            option.value = item.itemId;
            option.textContent =
            `${item.itemName} (Stock: ${item.stockLevel})`;
            select.appendChild(option);
        });
    });
}