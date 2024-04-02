const path = require('path');

const cart = require(path.join(__dirname, "../tools/cart_tools.js"));

const router = (req, res) => {
    if (req.url.includes('/cart/addItem/')) {
        if (req.method === 'POST') {
            let order_id = req.url.split('/')[3];
            let data = '';
		    req.on('data', (chunk) => {
				data += chunk
			})
			req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    const { menu_item_id, name, price, quantity, availability } = body;
                    cart.addItem(order_id, menu_item_id, name, price, quantity, availability, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error adding item to cart: ${err.message}`);
                        } else {
                            res.end('Item added to cart.');
                        }
                    });
                } catch (e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/updateQuantity')) {
        if (req.method === 'PUT') {
            let order_id = req.url.split('/')[3];
            let data = '';
		    req.on('data', (chunk) => {
				data += chunk
			})
			req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    const { menu_item_id, quantity } = body;
                    cart.updateQuantity(order_id, menu_item_id, quantity, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error updating item quantity: ${err.message}`);
                        } else {
                            res.end(`Item quantity updated to ${quantity}`);
                        }
                    });
                } catch (e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/incItem')) {
        if (req.method === 'PUT') {
            let order_id = req.url.split('/')[3];
            let data = '';
		    req.on('data', (chunk) => {
				data += chunk
			})
			req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    const { menu_item_id } = body;
                    cart.incItem(order_id, menu_item_id, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error incrementing item quantity: ${err.message}`);
                        } else {
                            res.end('Item quantity adjusted.');
                        }
                    });
                } catch (e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/decItem')) {
        if (req.method === 'PUT') {
            let order_id = req.url.split('/')[3];
            let data = '';
		    req.on('data', (chunk) => {
				data += chunk
			})
			req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    const { menu_item_id } = body;
                    cart.decItem(order_id, menu_item_id, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error decrementing item quantity: ${err.message}`);
                        } else {
                            res.end('Item quantity adjusted.');
                        }
                    });
                } catch (e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/removeItem')) {
        if (req.method === 'DELETE') {
            let order_id = req.url.split('/')[3];
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    let { menu_item_id } = body;
                    cart.removeItem(order_id, menu_item_id, (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error removing item from cart: ${err.message}`);
                        } else {
                            res.end('Item removed from cart.');
                        }
                    });
                } catch(e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/clearCart')) {
        if (req.method === 'DELETE') {
            let order_id = req.url.split('/')[3];
            cart.clearCart(order_id, (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain'});
                    res.end(`Error clearing cart: ${err.message}`);
                } else {
                    res.end('Cart cleared.');
                }
            });
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/getTotalPrice')) {
        if (req.method === 'GET') {
            let order_id = req.url.split('/')[3];
            cart.getTotalPrice(order_id, (err, totalPrice) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain'});
                    res.end(`Error getting total price: ${err.message}`);
                } else {
                    res.end(`Total Price: $${totalPrice}`);
                }
            });
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/getItemQuantity')) {
        if (req.method === 'GET') {
            let order_id = req.url.split('/')[3];
            cart.getItemQuantity(order_id, menu_item_id, (err, itemQuant) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain'});
                    res.end(`Error getting total price: ${err.message}`);
                } else {
                    res.end(`Amount of Item: ${itemQuant}`);
                }
            });
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/getItemPrice')) {
        if (req.method === 'POST') {
            let order_id = req.url.split('/')[3];
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    let { menu_item_id } = body;
                    cart.getItemPrice(order_id, menu_item_id, (err, itemPrice) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error getting total price: ${err.message}`);
                        } else {
                            res.end(`Price of Single Item: $${itemPrice}`);
                        }
                    });
                } catch(e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/getItemTotal')) {
        if (req.method === 'POST') {
            let order_id = req.url.split('/')[3];
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    let { menu_item_id } = body;
                    cart.getItemTotal(order_id, menu_item_id, (err, itemPrice) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain'});
                            res.end(`Error getting total price: ${err.message}`);
                        } else {
                            res.send(`Total Price of this Item: $${itemPrice}`);
                        }
                    });
                } catch(e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/reviewCart')) {
        if (req.method === 'GET') {
            let order_id = req.url.split('/')[3];
            cart.reviewCart(order_id, (err, cartItems) => {
                if (err) {
                    console.error('Error reviewing cart:', err);
                    res.writeHead(500, { 'Content-Type': 'text/plain'});
                    res.end('Error reviewing cart');
                } else {
                    if (cartItems.length === 0) {
                        res.end('Cart is empty');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json'});
                        res.end(cartItems);
                    }
                }
            });
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    } else if (req.url.includes('/cart/checkout')) {
        if (req.method === 'POST') {
            let order_id = req.url.split('/')[3];
            let data = '';
            req.on('data', (chunk) => {
                data += chunk;
            })
            req.on('end', () => {
                try {
                    let body = JSON.parse(data);
                    let { method } = body;
                    cart.checkout(req, res, method);
                } catch(e) {
                    //error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
                }
            })
        } else {
            //wrong method
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
        }
    }
}

module.exports = router;