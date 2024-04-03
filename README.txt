Shopping Cart ReadMe

Each URL must contain the function name, as well as the order_id to ensure you are dealing with the correct cart
It should look like: `http://localhost:3000/(function name)/order_id`

Below are the functions available for testing, as well as instructions:

1. addItem
    This function takes in an item id and quantity, then adds the item to the cart
    If the item is already in the cart, it will add the quantity to the existing amount
    URL: http://localhost:3000/addItem/order_id
    Method type: POST
    Body:
        {
            "menu_item_id" : " ",
            "name" : " ",
            "price" : FLOAT,
            "quantity": INT,
            "availability" : BOOLEAN
        }

2. removeItem
    This function takes in an item id, then removes that item completely from the cart
    URL: http://localhost:3000/removeItem/order_id
    Method type: DELETE
    Body:
        {
            "menu_item_id" : " "
        }

3. updateQuantity
    This function takes in an item id and quantity, then changes the item quantity to the input
    If the input quantity is 0, it removes the item from the cart
    URL: http://localhost:3000/updateQuantity/order_id
    Method type: PUT
    Body:
        {
            "menu_item_id" : " ",
            "quantity": INT
        }

4. incItem
    This function takes in an item id and increments its quantity by 1
    URL: http://localhost:3000/incItem/order_id
    Method type: PUT
    Body:
        {
            "menu_item_id" : " "
        }

5. decItem
    This function takes in an item id and decrements its quantity by 1
    If this lowers the quantity to 0, it removes the item from the cart
    URL: http://localhost:3000/decItem/order_id
    Method type: PUT
    Body:
        {
            "menu_item_id" : " "
        }

6. getTotalPrice
    This function returns the total price of the shopping cart given the order_id
    URL: http://localhost:3000/getTotalPrice/order_id
    Method type: GET
    Body: none

7. clearCart
    This function clears the entire cart given the order_id
    URL: http://localhost:3000/clearCart/order_id
    Method type: DELETE
    Body: none

8. getItemQuantity
    This function takes in an item id and returns the quantity of said item in the cart
    URL: http://localhost:3000/getItemQuantity/order_id
    Method type: GET
    Body:
        {
            "menu_item_id" : " "
        }

9. getItemPrice
    This function takes in an item id and returns the price of a 1 of said item
    URL: http://localhost:3000/getItemPrice/order_id
    Method type: GET
    Body:
        {
            "menu_item_id" : " "
        }

10. getItemTotal
    This function takes in an item id and returns the total price of said item in the cart, useful when the 
        quantity is greater than 0
    URL: http://localhost:3000/getItemTotal/order_id
    Method type: GET
    Body:
        {
            "menu_item_id" : " "
        }

11. reviewCart
    This function lists all the contents of the cart given the order_id
    URL: http://localhost:3000/clearCart/order_id
    Method type: GET
    Body: none

12. checkout
    This function is not yet fully implemented, but it will trigger the checkout/payment sequence given the order_id
    As of right now, it just thanks you for your purchase
    It does take in the method of payment, which will be important later on
    URL: http://localhost:3000/checkout/order_id
    Method type: POST
    Body: 
        {
            "method" : " "
        }

