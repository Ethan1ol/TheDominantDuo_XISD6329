// ================= LIVE PRICE =================


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


/* ================= Edit Customer================= */
function editCustomer(id){


let customer =
customers.find(c => c.customerId === id);



let oldName = customer.fullName;



let name =
prompt("Name", customer.fullName);


let contact =
prompt("Contact", customer.contact);


let email =
prompt("Email", customer.email);



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

async function createWalkInOrder(){


let name =
document.getElementById("walkName").value;


let contact =
document.getElementById("walkContact").value;


let email =
document.getElementById("walkEmail").value;



if(!name || !contact){

alert("Enter customer details");

return;

}




// FIND CUSTOMER OR CREATE NEW ONE

let customer =
customers.find(c => c.contact === contact);



if(!customer){


customer = {


customerId:
"CUS"+Math.floor(1000 + Math.random()*9000),


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
inventory.find(i=>i.itemId === vinylID);





if(!item || qty <= 0){


alert("Complete all design details");


return;


}




if(item.stockLevel < qty){


alert("Not enough stock for " + item.itemName);


return;


}





let design = {


designID:

"DES"+Math.floor(1000 + Math.random()*9000),


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

"ORD"+Math.floor(1000 + Math.random()*9000),



customerID:

customer.customerId,



customerName:

customer.fullName,



contact:

customer.contact,



items:

orderItems,



total:

total,



status:

"Pending",



date:

new Date().toLocaleDateString()


};





orders.push(order);



save();



alert("Walk-in order created");





// CLEAR FIELDS


document.getElementById("walkName").value="";

document.getElementById("walkContact").value="";

document.getElementById("walkEmail").value="";



document.querySelectorAll(".designName")
.forEach(x=>x.value="");



document.querySelectorAll(".designQty")
.forEach(x=>x.value="");



updateTotal();


showCustomersTable();



}

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


//remove button
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