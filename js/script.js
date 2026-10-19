let designs = JSON.parse(localStorage.getItem("designs")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let orders = JSON.parse(localStorage.getItem("orders")) || [];
let inventory = JSON.parse(localStorage.getItem("inventory")) || [
  { itemId: "INV001", itemName: "White Vinyl", stockLevel: 150, price: 45 },
  { itemId: "INV002", itemName: "Black Vinyl", stockLevel: 250, price: 60 },
  { itemId: "INV003", itemName: "Pink Vinyl", stockLevel: 150, price: 55 },
  { itemId: "INV004", itemName: "Green Vinyl", stockLevel: 80, price: 40 }
];

function save(){
localStorage.setItem("customers",JSON.stringify(customers));
localStorage.setItem("orders",JSON.stringify(orders));
localStorage.setItem("inventory",JSON.stringify(inventory));
localStorage.setItem("designs",JSON.stringify(designs));
}

function display(msg) {
  let el = document.getElementById("output");
  if (el) el.innerText = msg;
}

// DASHBOARD
function loadDashboard(){
  let c = document.getElementById("customerCount");
  let o = document.getElementById("orderCount");
  let s = document.getElementById("stockCount");
  
  if(c)
  c.innerText = customers.length;

  if(o)
  o.innerText = orders.length;

  if(s)
  s.innerText = inventory.filter(i=>i.stockLevel <= 20).length;

}


/*  CUSTOMERS  */
function addCustomer() {
  let name = document.getElementById("name").value.trim();
  let contact = document.getElementById("contact").value.trim();
  let email = document.getElementById("email").value.trim();
  if(!name || !contact){
    alert("Enter the customer's name and contact details.");
    return;
  }
  if(customers.some(customer => customer.contact === contact)){
    alert("A customer with this contact number already exists.");
    return;
  }

  customers.push({
    customerId: "CUS"+Math.floor(1000 + Math.random() * 9000),
    fullName: name,
    contact,
    email
  });

  save();
  updateDropdowns();
  showCustomersTable();
}

function showCustomersTable(list = customers) {
  let table = document.getElementById("customerTable");
  if(!table) return;

  let html = `<table style="width:100%; color:white;">
  <tr style="color:#ff7a00">
    <th>ID</th><th>Name</th><th>Contact</th><th>Email</th><th>Actions</th>
  </tr>`;

  list.forEach(c => {
    html += `
    <tr>
      <td>${c.customerId}</td>
      <td>${c.fullName}</td>
      <td>${c.contact}</td>
      <td>${c.email}</td>
      <td>
      <button onclick="selectCustomerOrder('${c.customerId}')">
      Make Order </button>
      
      <button onclick="editCustomer('${c.customerId}')">
      Edit </button>
      
      <button onclick="deleteCustomer('${c.customerId}')">
      Delete </button>
      </td>
    </tr>`;
  });

  html += `</table>`;
  table.innerHTML = html;
}

function selectCustomerOrder(id){


let customer =
customers.find(c => c.customerId === id);



document.getElementById("walkName").value = customer.fullName;
document.getElementById("walkContact").value = customer.contact;
document.getElementById("walkEmail").value = customer.email;

window.scrollTo({top:0, behavior:"smooth"});

}


function deleteCustomer(id) {


  // delete customer
  customers = customers.filter(c => 
    c.customerId !== id
  );


  // delete all orders linked to customer
  orders = orders.filter(o => 
    o.customerID !== id
  );


  save();


  showCustomersTable();


  alert("Customer and order history deleted");

}

function searchCustomer() {
  let val = document.getElementById("search").value.toLowerCase();
  showCustomersTable(customers.filter(c => c.fullName.toLowerCase().includes(val)));
}

//admin is able to view customer order history
function viewCustomerOrders(id){
  let customer =
  customers.find(c => c.customerId === id);

  let customerOrders =
  orders.filter(o => o.customerID === id);
  
  if(!customer){
    display("Customer not found");
    return;
  }

  let report = `
  CUSTOMER ORDER HISTORY
  
  Customer:
  ${customer.fullName}
  
  Contact:
  ${customer.contact}
  
  Email:
  ${customer.email}
  ========================
  `;
  
  customerOrders.forEach(o=>{
    
    report += `
    Order ID:
    ${o.orderID}
    
    Designs:
    ${(o.items || []).map(item =>
      `${item.designName} - ${item.vinyl}, quantity ${item.quantity}`
    ).join("\n    ") || `${o.itemName || "No design details"} - quantity ${o.qty || 0}`}

    Total:
    R${o.total}

    Status:
    ${o.status}

    Date:
    ${o.date}

    ------------------------

    `;

  });


  display(report);
}


function showOrders(){
  let details = document.getElementById("orderDetails");
  if(!details) return;

  details.hidden = !details.hidden;
  if(details.hidden) return;

  if(orders.length === 0){
    details.textContent = "No orders have been placed yet.";
    return;
  }

  details.textContent = orders.map(order => {
    let items = order.items || [];
    let designs = items.length
      ? items.map((item, index) =>
        `  ${index + 1}. ${item.designName || "Untitled design"} | ${item.vinyl || "Material unavailable"} | Qty: ${item.quantity ?? item.qty ?? 0} | R${item.total ?? 0}`
      ).join("\n")
      : `  ${order.itemName || "Design details unavailable"} | Qty: ${order.qty || 0}`;

    return [
      `Order: ${order.orderID}`,
      `Customer: ${order.customerName || "Unknown"} (${order.contact || "No contact"})`,
      `Status: ${order.status || "Pending"}`,
      `Date: ${order.date || "Unknown"}`,
      "Designs:",
      designs,
      `Total: R${order.total || 0}`
    ].join("\n");
  }).join("\n\n------------------------------\n\n");
}

function showOrderTable(){
  let container = document.getElementById("orderTable");
  if(!container) return;

  let table = document.createElement("table");
  let head = table.createTHead().insertRow();
  ["Order", "Customer", "Designs", "Total", "Status", "Actions"].forEach(label => {
    let th = document.createElement("th");
    th.textContent = label;
    head.appendChild(th);
  });

  let body = table.createTBody();
  orders.forEach(order => {
    let row = body.insertRow();
    [
      order.orderID,
      order.customerName || "Unknown",
      (order.items || []).length || 1,
      `R${order.total || 0}`,
      order.status || "Pending"
    ].forEach(value => {
      row.insertCell().textContent = value;
    });

    let actions = row.insertCell();
    let editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editOrder(order.orderID));
    actions.appendChild(editButton);

    ["Processing", "Completed"].forEach(status => {
      let button = document.createElement("button");
      button.type = "button";
      button.textContent = status;
      button.addEventListener("click", () => changeStatus(order.orderID, status));
      actions.appendChild(button);
    });
  });

  container.replaceChildren(table);
}

function changeStatus(id,status){
  let order = orders.find(o => o.orderID === id);
  if(!order) return;

  order.status=status;

  save();
  showOrderTable();
}

function createOrderFromInput({name, contact, email}){
  let normalizedName = name.trim();
  let normalizedContact = contact.trim();
  if(!normalizedName || !normalizedContact){
    return {success: false, message: "Enter customer name and contact details."};
  }

  let rows = [...document.querySelectorAll(".designRow")];
  if(rows.length === 0){
    return {success: false, message: "Add at least one design to the order."};
  }

  let orderItems = [];
  let requestedStock = new Map();
  for(let row of rows){
    let designName = row.querySelector(".designName").value.trim();
    let vinylID = row.querySelector(".designVinyl").value;
    let quantity = Number(row.querySelector(".designQty").value);
    let item = inventory.find(entry => entry.itemId === vinylID);

    if(!designName || !item || !Number.isInteger(quantity) || quantity <= 0){
      return {success: false, message: "Complete each design name, material, and positive whole-number quantity."};
    }

    requestedStock.set(item.itemId, (requestedStock.get(item.itemId) || 0) + quantity);
    orderItems.push({
      designID: "DES" + Math.floor(1000 + Math.random() * 9000),
      designName,
      itemId: item.itemId,
      vinyl: item.itemName,
      quantity,
      price: item.price,
      total: quantity * item.price
    });
  }

  for(let [itemId, quantity] of requestedStock){
    let item = inventory.find(entry => entry.itemId === itemId);
    if(item.stockLevel < quantity){
      return {success: false, message: `Not enough stock for ${item.itemName}. Available: ${item.stockLevel}.`};
    }
  }

  let customer = customers.find(entry => entry.contact === normalizedContact);
  let isNewCustomer = !customer;
  if(isNewCustomer){
    customer = {
      customerId: "CUS" + Math.floor(1000 + Math.random() * 9000),
      fullName: normalizedName,
      contact: normalizedContact,
      email: email.trim()
    };
  }

  requestedStock.forEach((quantity, itemId) => {
    let item = inventory.find(entry => entry.itemId === itemId);
    item.stockLevel -= quantity;
  });

  if(isNewCustomer) customers.push(customer);

  let order = {
    orderID: "ORD" + Math.floor(1000 + Math.random() * 9000),
    customerID: customer.customerId,
    customerName: customer.fullName,
    contact: customer.contact,
    items: orderItems,
    total: orderItems.reduce((sum, item) => sum + item.total, 0),
    status: "Pending",
    date: new Date().toLocaleDateString()
  };

  orders.push(order);
  save();
  updateTotal();
  loadVinylOptions();
  showInventoryTable();
  loadDashboard();
  showCustomersTable();
  showOrderTable();
  return {success: true, order};
}

function addOrderEditDesign(item = {}){
  let container = document.getElementById("editDesignContainer");
  if(!container) return;

  let row = document.createElement("div");
  row.className = "designRow edit-design-row";

  let name = document.createElement("input");
  name.className = "editDesignName";
  name.placeholder = "Design name";
  name.value = item.designName || "";
  name.setAttribute("aria-label", "Design name");

  let select = document.createElement("select");
  select.className = "editDesignVinyl";
  select.setAttribute("aria-label", "Material");
  let placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select material";
  select.appendChild(placeholder);

  inventory.forEach(stockItem => {
    let option = document.createElement("option");
    option.value = stockItem.itemId;
    option.textContent = `${stockItem.itemName} (Stock: ${stockItem.stockLevel})`;
    select.appendChild(option);
  });
  let selectedItem = inventory.find(stockItem =>
    item.itemId ? stockItem.itemId === item.itemId : stockItem.itemName === item.vinyl
  );
  if(selectedItem) select.value = selectedItem.itemId;

  let quantity = document.createElement("input");
  quantity.className = "editDesignQty";
  quantity.type = "number";
  quantity.min = "1";
  quantity.step = "1";
  quantity.placeholder = "Quantity";
  quantity.value = item.quantity ?? item.qty ?? "";
  quantity.setAttribute("aria-label", "Quantity");

  let removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove design";
  removeButton.addEventListener("click", () => row.remove());

  row.append(name, select, quantity, removeButton);
  container.appendChild(row);
}

function editOrder(id){
  let order = orders.find(entry => entry.orderID === id);
  let dialog = document.getElementById("orderEditor");
  if(!order || !dialog) return;

  document.getElementById("editOrderId").value = order.orderID;
  document.getElementById("editCustomerName").value = order.customerName || "";
  document.getElementById("editCustomerContact").value = order.contact || "";
  document.getElementById("editOrderStatus").textContent = "";

  let container = document.getElementById("editDesignContainer");
  container.replaceChildren();
  let items = order.items || [];
  if(items.length){
    items.forEach(item => addOrderEditDesign(item));
  } else {
    addOrderEditDesign({
      designName: order.designName || "Design 1",
      vinyl: order.vinyl || order.itemName || "",
      quantity: order.qty || 1
    });
  }
  dialog.showModal();
}

function saveOrderEdit(event){
  event.preventDefault();
  let orderId = document.getElementById("editOrderId").value;
  let order = orders.find(entry => entry.orderID === orderId);
  let status = document.getElementById("editOrderStatus");
  if(!order){
    status.textContent = "This order could not be found.";
    return;
  }

  let name = document.getElementById("editCustomerName").value.trim();
  let contact = document.getElementById("editCustomerContact").value.trim();
  if(!name || !contact){
    status.textContent = "Customer name and contact are required.";
    return;
  }

  let linkedCustomer = customers.find(entry => entry.customerId === order.customerID);
  if(customers.some(entry =>
    entry.customerId !== (linkedCustomer && linkedCustomer.customerId) &&
    entry.contact === contact
  )){
    status.textContent = "Another customer already uses this contact number.";
    return;
  }

  let oldItems = order.items || [];
  if(oldItems.length === 0 && order.itemName){
    oldItems = [{vinyl: order.itemName, quantity: order.qty}];
  }
  let oldQuantities = new Map();
  oldItems.forEach(item => {
    let inventoryItem = inventory.find(entry =>
      item.itemId ? entry.itemId === item.itemId : entry.itemName === item.vinyl
    );
    let quantity = Number(item.quantity ?? item.qty ?? 0);
    if(inventoryItem && quantity > 0){
      oldQuantities.set(inventoryItem.itemId,
        (oldQuantities.get(inventoryItem.itemId) || 0) + quantity);
    }
  });

  let newItems = [];
  let newQuantities = new Map();
  let rows = [...document.querySelectorAll("#editDesignContainer .edit-design-row")];
  if(rows.length === 0){
    status.textContent = "An order must contain at least one design.";
    return;
  }

  for(let row of rows){
    let designName = row.querySelector(".editDesignName").value.trim();
    let item = inventory.find(entry => entry.itemId === row.querySelector(".editDesignVinyl").value);
    let quantity = Number(row.querySelector(".editDesignQty").value);
    if(!designName || !item || !Number.isInteger(quantity) || quantity <= 0){
      status.textContent = "Complete each design name, material, and positive whole-number quantity.";
      return;
    }

    newQuantities.set(item.itemId, (newQuantities.get(item.itemId) || 0) + quantity);
    newItems.push({
      designID: "DES" + Math.floor(1000 + Math.random() * 9000),
      designName,
      itemId: item.itemId,
      vinyl: item.itemName,
      quantity,
      price: item.price,
      total: quantity * item.price
    });
  }

  for(let [itemId, quantity] of newQuantities){
    let item = inventory.find(entry => entry.itemId === itemId);
    let available = item.stockLevel + (oldQuantities.get(itemId) || 0);
    if(quantity > available){
      status.textContent = `Not enough stock for ${item.itemName}. Available to this order: ${available}.`;
      return;
    }
  }

  oldQuantities.forEach((quantity, itemId) => {
    let item = inventory.find(entry => entry.itemId === itemId);
    item.stockLevel += quantity;
  });
  newQuantities.forEach((quantity, itemId) => {
    let item = inventory.find(entry => entry.itemId === itemId);
    item.stockLevel -= quantity;
  });

  order.customerName = name;
  order.contact = contact;
  order.items = newItems;
  order.total = newItems.reduce((sum, item) => sum + item.total, 0);
  if(linkedCustomer){
    linkedCustomer.fullName = name;
    linkedCustomer.contact = contact;
    orders.forEach(existingOrder => {
      if(existingOrder.customerID === linkedCustomer.customerId){
        existingOrder.customerName = name;
        existingOrder.contact = contact;
      }
    });
  }

  save();
  showOrderTable();
  showCustomersTable();
  showInventoryTable();
  loadVinylOptions();
  loadDashboard();
  document.getElementById("orderEditor").close();
}


// CUSTOMER ORDER allows customers place orders
async function placeOrder(){
  let result = createOrderFromInput({
    name: document.getElementById("custName").value,
    contact: document.getElementById("custContact").value,
    email: document.getElementById("custEmail").value
  });
  if(!result.success){
    alert(result.message);
    return;
  }

  display(`Order placed successfully.\nReference: ${result.order.orderID}\nTotal: R${result.order.total}`);
}


function changeOrderType(){
  
  let type =document.getElementById("orderSource").value;
  
  if(type==="Admin"){
    document.getElementById("newCustomer").style.display="none";
    document.getElementById("existingCustomer").style.display="block";
    loadCustomerDropdown();
  }
  
  else{
    document.getElementById("newCustomer").style.display="block";
    document.getElementById("existingCustomer").style.display="none";
  }
}



// DROPDOWNS 

function updateDropdowns() {

  let walk = document.getElementById("walkItem");
  let customerItem = document.getElementById("itemSelect");
  
  if(walk){
    walk.innerHTML = "";
    inventory.forEach(i=>{
      let opt = document.createElement("option");
      opt.value = i.itemId;
      
      opt.textContent =
      `${i.itemName} (Stock: ${i.stockLevel})`;
      
      walk.appendChild(opt);
    });
  }

  if(customerItem){
    customerItem.innerHTML = "";
    inventory.forEach(i=>{

      let opt = document.createElement("option");
      opt.value = i.itemId;
      opt.textContent =`${i.itemName} (Stock: ${i.stockLevel})`;

      customerItem.appendChild(opt);
    });
  }
}


function loadCustomerDropdown(){

  let select = document.getElementById("customerSelect");
  select.innerHTML="";
  customers.forEach(c=>{
    let option = document.createElement("option");
    option.value=c.customerId;
    option.textContent=c.fullName;
    
    select.appendChild(option);
  });
}

// INIT 

window.onload = function(){
  updateDropdowns();
  if(document.getElementById("itemSelect") && typeof updatePrice === "function"){
    updatePrice();
  }
};
