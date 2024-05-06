const http = require('http');
const path = require('path');
const url = require('url');
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(path.join(__dirname, "./order.db"));

// Create HTTP server to listen for incoming requests
const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    const pathname = reqUrl.pathname;

    if (req.method === 'PATCH' && pathname === '/seller/order_management') {
        let requestBody = '';
        req.on('data', chunk => {
            requestBody += chunk.toString();
        });

        req.on('end', () => {
            const { orderNumber, action } = JSON.parse(requestBody);

            if (!orderNumber || !action) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Order number and action are required.' }));
                return;
            }

            if (action !== 'accept' && action !== 'deny') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid action. Please specify "accept" or "deny".' }));
                return;
            }

            // Define the status based on the action
            const status = action === 'accept' ? 'accepted' : 'denied';

            // Prepare the SQL statement
            const sql = `UPDATE Orders SET status = ? WHERE order_id = ?`;

            // Execute the SQL statement
            db.run(sql, [status, orderNumber], function(err) {
                if (err) {
                    console.error('Error updating order status:', err.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal server error' }));
                    return;
                }
                console.log(`Order status updated successfully. Rows affected: ${this.changes}`);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Order status updated successfully' }));
            });
        });
    } else if (pathname === '/seller/order_management/accept_deny_orders' && req.method === 'GET') {
        // Load HTML file
        const fs = require('fs');
        const htmlPath = path.join(__dirname, 'accept_deny.html');
        fs.readFile(htmlPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (reqUrl.pathname === '/seller/order_management/order_history' && req.method === 'GET') {
        // Retrieve all orders from the database
        const query = 'SELECT * FROM Orders';

        db.all(query, (err, rows) => {
            if (err) {
                console.error('Error executing query:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal server error' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(rows));
            }
        });
    } else {
        // Send 404 for requests to other routes or methods
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
