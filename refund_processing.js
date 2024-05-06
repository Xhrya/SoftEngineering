const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3');
const url = require('url');
const fs = require('fs');

// Create HTTP server to listen for incoming requests
const server = http.createServer((req, res) => {
    if (req.url === '/seller/order_management/refunds') {
        fs.readFile('refunds.html', function(err, data) {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.method === 'POST' && req.url === '/seller/order_management/submit_refund') {
        let requestBody = '';

        // Collect data as it comes in
        req.on('data', chunk => {
            requestBody += chunk.toString();
        });

        // When all data is received
        req.on('end', () => {
            try {
                const params = new URLSearchParams(requestBody);
                const orderNumber = params.get('orderNumber');

                // Open the SQLite database
                const db = new sqlite3.Database(path.join(__dirname, "./order.db"));

                // Prepare the SQL statement
                const sql = `UPDATE Orders SET status = 'Issued Refund' WHERE order_id = ?`;

                // Execute the SQL statement
                db.run(sql, [orderNumber], function(err) {
                    if (err) {
                        console.error('Error updating order status:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Internal server error' }));
                        return;
                    }
                    console.log(`Order status updated successfully. Rows affected: ${this.changes}`);

                    // Send response with dynamic HTML
                    const htmlResponse = `<html><head><title>Refund Issued</title></head><body><h1>Refund for order ${orderNumber} has been issued.</h1></body></html>`;
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(htmlResponse);
                });

                // Close the database connection
                db.close();
            } catch (error) {
                console.error('Error parsing form data:', error.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid form data' }));
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
