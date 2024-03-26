const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3');

// Create HTTP server to listen for incoming requests
const server = http.createServer((req, res) => {
    if (req.method === 'PATCH' && req.url.startsWith('/orders/')) {
        const parts = req.url.split('/');
        const orderId = parts[2]; // Extract order ID from the URL

        let requestBody = '';

        // Collect data as it comes in
        req.on('data', chunk => {
            requestBody += chunk.toString();
        });

        // When all data is received
        req.on('end', () => {
            try {
                const jsonData = JSON.parse(requestBody);

                // Extract input parameters from the request body
                const input = jsonData.input;

                // Validate input
                if (input !== 'accept' && input !== 'deny') {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid input. Please enter "accept" or "deny".' }));
                    return;
                }

                // Open the SQLite database
                const db = new sqlite3.Database(path.join(__dirname, "./order.db"));

                // Define the status based on the input
                const status = input === 'accept' ? 'approved' : 'denied';

                // Prepare the SQL statement
                const sql = `UPDATE Orders SET status = ? WHERE order_id = ?`;

                // Execute the SQL statement
                db.run(sql, [status, orderId], function(err) {
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

                // Close the database connection
                db.close();
            } catch (error) {
                console.error('Error parsing JSON:', error.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON format' }));
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
