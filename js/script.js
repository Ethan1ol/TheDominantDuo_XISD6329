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
// ================= DASHBOARD =================


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
  let name = document.getElementById("name").value;
  let contact = document.getElementById("contact").value;
  let email = document.getElementById("email").value;

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
  document.getElementById("customerTable").innerHTML = html;
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

function viewCustomerOrders(id){


let customer =
customers.find(c => c.customerId === id);



let customerOrders =
orders.filter(o => o.customerID === id);



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


Item:
${o.itemName}


Quantity:
${o.qty}


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


/* ================= ORDERS ================= */

function showOrders(){


let report = "";



orders.forEach(o => {


report +=
`
========================

Order ID:
${o.orderID}


Customer:
${o.customerName}


Contact:
${o.contact}


Item:
${o.itemName}


Quantity:
${o.qty}


Total:
R${o.total}


Status:
${o.status}


Date:
${o.date}


========================

`;

});


display(report);


}

function showOrderTable(){


let html = `
<table>

<tr>

<th>Order</th>
<th>Customer</th>
<th>Total</th>
<th>Status</th>
<th>Action</th>

</tr>

`;


orders.forEach(o=>{


html+=`

<tr>

<td>${o.orderID}</td>

<td>${o.customerName}</td>

<td>R${o.total}</td>

<td>${o.status}</td>


<td>


<button onclick="changeStatus('${o.orderID}','Processing')">

Processing

</button>



<button onclick="changeStatus('${o.orderID}','Completed')">

Completed

</button>


</td>


</tr>


`;

});


html+="</table>";


document.getElementById("orderTable").innerHTML=html;


}




function changeStatus(id,status){


let order =
orders.find(o=>o.orderID===id);
order.status=status;


save();
showOrderTable();
}



/*  CUSTOMER ORDER  */

async function placeOrder(){


let name =
document.getElementById("custName").value;


let contact =
document.getElementById("custContact").value;


let email =
document.getElementById("custEmail").value;



if(!name || !contact){

alert("Enter customer details");

return;

}




// find existing customer

let customer =
customers.find(c => c.contact === contact);



if(!customer){


customer = {


customerId:
"CUS"+Math.floor(1000+Math.random()*9000),


fullName:name,


contact:contact,


email:email


};



customers.push(customer);


}





let rows =
document.querySelectorAll(".designRow");



let orderItems = [];



let total = 0;




for(let row of rows){



let designName =
row.querySelector(".designName").value;



let vinylID =
row.querySelector(".designVinyl").value;



let qty =
Number(row.querySelector(".designQty").value);



let item =
inventory.find(i => i.itemId === vinylID);




if(!designName || !item || qty <= 0){


alert("Complete all design details");


return;


}




if(item.stockLevel < qty){


alert("Not enough stock for "+item.itemName);


return;


}




let design = {


designID:
"DES"+Math.floor(1000+Math.random()*9000),


designName:designName,


vinyl:item.itemName,


quantity:qty,


price:item.price,


total:qty * item.price


};




orderItems.push(design);



item.stockLevel -= qty;



total += design.total;



}




let order = {


orderID:
"ORD"+Math.floor(1000+Math.random()*9000),


customerID:
customer.customerId,


customerName:
customer.fullName,


contact:
customer.contact,


items:
orderItems,


total:total,


status:"Pending",


date:
new Date().toLocaleDateString()


};





orders.push(order);



save();




display(`

ORDER PLACED SUCCESSFULLY


Order Reference:

${order.orderID}



Customer:

${customer.fullName}



Total:

R${order.total}



Status:

${order.status}



Designs:

${order.items.length}


`);




updateTotal();


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



/* ================= DROPDOWNS ================= */

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

/* ================= INIT ================= */

window.onload = function(){

updateDropdowns();

updatePrice();

};

