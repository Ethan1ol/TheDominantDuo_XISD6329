function searchCustomerOrders(){
    let name =
    document.getElementById("trackName").value.toLowerCase();

    let contact =
    document.getElementById("trackContact").value;
    let customer =
    customers.find(c =>
        
        c.fullName.toLowerCase() === name
        &&
        c.contact === contact
    );
    
    if(!customer){
        display("Customer not found");
        return;
    }
    
    let customerOrders =
    orders.filter(o =>
        o.customerID === customer.customerId
    );
    
    if(customerOrders.length === 0){
        display("No orders found");
        return;
    }
    
    let report = `
    ORDER HISTORY
    ====================
    Customer:
    ${customer.fullName}`;

    customerOrders.forEach(order=>{
        report += `
        Order Reference:
        ${order.orderID}
        
        Status:
        ${order.status}
        
        Date:
        ${order.date}
        
        Designs:
        `;
        
        order.items.forEach((item,index)=>{
            report += `
            Design ${index+1}
            
            Name:
            ${item.designName}
            
            Vinyl:
            ${item.vinyl}
            
            Quantity:
            ${item.quantity}
            
            Price:
            R${item.total}
            ------------------
            
            `;
        
        });
        
        
        report += `
        TOTAL:
        R${order.total}
        
        ====================

        `;
    });
    
    display(report);
}