/* ================= INVENTORY ================= */

function showInventory() {

  let report = "";

  report += "INVENTORY REPORT\n";
  report += "========================\n\n";


  inventory.forEach(i => {


    report +=
    `Item ID: ${i.itemId}
    Item Name: ${i.itemName}
    Current Stock: ${i.stockLevel}
    Price: R${i.price}
    ------------------------
    `;
  });

  display(report);
}


function showStockChart() {
  display(inventory.map(i =>
    `${i.itemName}: ${"█".repeat(i.stockLevel / 10)}`
  ).join("\n"));
}

function lowStockReport(){
  
  let report=
  "LOW STOCK ALERT\n\n";
  
  inventory
  .filter(i=>i.stockLevel<=20)
  .forEach(i=>{


report+=
`
Item:
${i.itemName}

Current Stock:
${i.stockLevel}

----------------

`;});
display(report);

}

// INVENTORY MANAGEMENT


function showInventoryTable(){
  let html = `
  <table>

  <tr>

  <th>ID</th>

  <th>Name</th>
  
  <th>Stock</th>

  <th>Price</th>

  <th>Actions</th>

  </tr>

`;



inventory.forEach(i=>{


html +=

`

<tr>


<td>${i.itemId}</td>


<td>${i.itemName}</td>


<td>${i.stockLevel}</td>


<td>R${i.price}</td>



<td>


<button onclick="editInventory('${i.itemId}')">

Edit

</button>



<button onclick="deleteInventory('${i.itemId}')">

Delete

</button>


</td>


</tr>

`;

});


html += "</table>";
document.getElementById("inventoryTable").innerHTML = html;


}




function addInventory(){
  let name = document.getElementById("itemName").value;
  let stock = Number(document.getElementById("stockLevel").value);
  let price = Number(document.getElementById("itemPrice").value);

let item = {
  itemId:"INV"+Math.floor(1000 + Math.random() * 9000),
  
  itemName:name,
  
  stockLevel:stock,
  
  price:price

};



inventory.push(item);

save();

showInventoryTable();

alert("Inventory added");


}




function editInventory(id){
  let item = inventory.find(i=>i.itemId===id);
  let stock =
  prompt(
    "Update Stock",
    item.stockLevel
  );



let price =
prompt(
  "Update Price",
  item.price
);



item.stockLevel =
Number(stock);

item.price =
Number(price);

save();
showInventoryTable();
}

function deleteInventory(id){
inventory = inventory.filter(i=>i.itemId !== id);
save();
showInventoryTable();


}

//Upload image
function uploadDesignImage(inputID){

return new Promise((resolve)=>{


let file =
document.getElementById(inputID).files[0];


if(!file){

resolve(null);

return;

}


let reader = new FileReader();



reader.onload = function(e){


resolve(e.target.result);


};



reader.readAsDataURL(file);



});


}