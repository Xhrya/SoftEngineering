const path = require('path');
const db = require('./db.js');


function addItem(order_id, menu_item_id, name, price, quantity, availability, callback) { //Add item to cart
    getItemQuantity(order_id, menu_item_id, (err, itemQuantity) => {    //Check if it exists first
        if (err) {
            console.error(`Error obtaining quantity of item:`, err);
            callback(err);
        } else {
            if (itemQuantity > 0) { // Item already exists in cart, update quantity
                updateQuantity(order_id, menu_item_id, quantity + itemQuantity, callback);
            } else if (!availability) {
                console.log(`This item is no longer available.`);
                callback(null);
            } else {    // Add new item to cart
                db.run(`INSERT INTO ShoppingCart (order_id, menu_item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)`, 
                    [order_id, menu_item_id, name, price, quantity], function(err){
                        if(err){
                            console.error(`There was an error adding ${name} to cart: `, err);
                            callback(err);
                        } else {
                            console.log(`Added ${quantity} of ${name} to the cart.`);
                            callback(null);
                        }
                });
            }
        }
    });
}

function removeItem(order_id, menu_item_id, callback){          //Remove item completely from cart
    db.query('DELETE FROM ShoppingCart WHERE menu_item_id = ? AND order_id = ?', [menu_item_id, order_id], function(err){
        if(err) {
            console.error(`Error removing item from cart: `, err);
        }
        else {
            console.log(`Item successfully removed.`);
        }
    });
}

function updateQuantity(order_id, menu_item_id, newQuant, callback){       //Set item quantity to newQuant
    if(newQuant <= 0){  // If the requested new quantity is 0 or less, remove the item from the cart completely
        removeItem(order_id, menu_item_id, callback)
    }
    else {
        db.query(`UPDATE ShoppingCart SET quantity = ? WHERE menu_item_id = ? AND order_id = ?`, [newQuant, menu_item_id, order_id], function(err){
            if(err){ 
                console.error(`Error changing quantity of item in cart: `, err);
                callback(err);}
            else{
                console.log(`Item quantity successfully changed to ${newQuant}`);
                callback(null);
            }
        });
    }
}

function incItem(order_id, menu_item_id, callback){     //Increase item quantity by 1
    getItemQuantity(order_id, menu_item_id, function(err,quantity) {
        if(err){
            console.error(`Error obtaining item quantity`,err);
            callback(err);
        }
        else {
            const newQuant = quantity + 1;
            updateQuantity(order_id, menu_item_id, newQuant, function(err){
                if(err) {
                    console.error(`Error incrementing item`, err);
                    callback(err);
                }
                else {
                    console.log(`Item quantity successfully incremented.`);
                    callback(null);
                }
            });
        }
    });
}

function decItem(order_id, menu_item_id, callback) {     //Decrease item quantity by 1
    getItemQuantity(order_id, menu_item_id, function(err,quantity) {
        if(err){
            console.error(`Error obtaining item quantity`,err);
            callback(err);
        }
        else {
            const newQuant = quantity - 1;
            updateQuantity(order_id, menu_item_id, newQuant, function(err){
                if(err) {
                    console.error(`Error decrementing item`, err);
                    callback(err);
                }
                else {
                    console.log(`Item quantity successfully decremented.`);
                    callback(null);
                }
            });
        }
    });
}

function getTotalPrice(order_id, callback){   //Get total price of all items in cart
    db.get(`SELECT SUM(price * quantity) AS total FROM ShoppingCart WHERE order_id = ?`, [order_id], function(err,row){
        if(err){
            console.error(`Error obtaining total price: `, err);
        callback(err);}
        else{
            let totalPrice = 0;
            if(row.total != null)
                totalPrice = row.total;
            console.log(`The total price is $${totalPrice}`);
        callback(null, totalPrice);}
    });
}

function clearCart(order_id, callback){   //Remove all items from cart
    db.query('DELETE FROM ShoppingCart WHERE order_id = ?', [order_id], function(err){
        if(err){
            console.error(`Error clearing your cart: `, err);
            callback(err);
        }
        else{
            console.log(`Successfully cleared cart!`);
            callback(null);
        }
    });
}

function getItemQuantity(order_id, menu_item_id, callback) { //Return item quantity
    db.query(`SELECT quantity FROM ShoppingCart WHERE menu_item_id = ? AND order_id = ?`, [menu_item_id, order_id], function(err, row) {
        if (err) {
            console.error(`Error obtaining quantity of item`, err);
            callback(err, null);
        } else {
            const quant = row ? row.quantity : 0;
            callback(null, quant);
        }
    });
}
function getItemPrice(order_id, menu_item_id, callback){    //Returns price of single item which will be used as a display
    db.query(`SELECT price FROM ShoppingCart WHERE menu_item_id = ? AND order_id = ?`, [menu_item_id, order_id], function(err, row) {
        if (err) {
            console.error(`Error obtaining price of item`, err);
            callback(err, null);
        } else {
            const p = row ? row.price : 0;
            callback(null, p);
        }
    });
}

function getItemTotal(order_id, menu_item_id, callback){   //Get total price of an item with quantity > 1
    db.query(`SELECT SUM(price * quantity) AS total FROM ShoppingCart WHERE order_id = ? AND menu_item_id = ?`, [order_id, menu_item_id], function(err,row){
        if(err){
            console.error(`Error obtaining item total price: `, err);
        callback(err);}
        else{
            let totalPrice = 0;
            if(row.total != null)
                totalPrice = row.total;
            console.log(`The total price of this item is $${totalPrice}`);
        callback(null, totalPrice);}
    });
}

function reviewCart(order_id, callback) {
    const prompt = `SELECT menu_item_id, name, quantity, price FROM ShoppingCart WHERE order_id = ?`;

    db.query(prompt, [order_id], function(err, rows) {
        if (err) {
            console.error('Error reviewing your cart:', err);
            callback(err, null);
        } else {
            if (rows.length === 0) {
                callback(null, 'Cart is empty');
            } else {
                const cartItems = rows.map(function(item) {
                    return {
                        menu_item_id: item.menu_item_id,
                        name: item.name,
                        quantity: `${item.quantity}`,
                        price: `$${item.price}`,
                        "total price for item": `$${item.price*item.quantity}`
                    }
                });
                callback(null, cartItems);
            }
        }
    });
}

function checkout(req, res, method){        //Checkout function
    //pay.handlePayment(req, res, method);
    console.log(`Thank you for your purchase!`);
}

module.exports = {
    addItem,
    removeItem, 
    clearCart,
    updateQuantity,
    incItem,
    decItem,
    getItemPrice,
    getItemQuantity,
    getTotalPrice,
    getItemTotal,
    reviewCart,
    checkout
}