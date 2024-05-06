const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));

const router = (req, res) => {
    if (req.url == '/orders') {
        if (req.method === 'GET') {
            let q = `SELECT * FROM Orders`;
            db.all(q, (err, rows) => {
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
            // Handle requests to other routes or methods
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad request' }));
        }
    } else if (req.url == '/orders/generation') {
        if (req.method === 'POST') {
            let requestBody = '';

            // Collect data as it comes in
            req.on('data', chunk => {
                requestBody += chunk.toString();
            });

            // When all data is received
            req.on('end', () => {
                try {
                    const jsonData = JSON.parse(requestBody);

                    // Insert the JSON data into the Orders table
                    const { customer, seller, items, status, total_price } = jsonData;
                    const q = 'INSERT INTO Orders (customer, seller, items, status, total_price) VALUES (?, ?, ?, ?, ?)';

                    db.run(q, [customer, seller, items, status, total_price], function(err) {
                        if (err) {
                            console.error('Error inserting data into database:', err.message);
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Internal server error' }));
                        } else {
                            console.log('Data inserted successfully with ID:', this.lastID);
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: 'Data inserted successfully', orderId: this.lastID }));
                        }
                    });
                } catch (error) {
                    console.error('Error parsing JSON:', error.message);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid JSON format' }));
                }
            })
        } else {
            // Handle requests to other routes or methods
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Bad request' }));
        }
    } else if (req.url == '/orders/accept') {
        if (req.method === 'PATCH') {
            const parts = req.url.split('/');
            const orderId = parts[3]; // Extract order ID from the URL

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
            })
        }
    } else {
        // Send 404 for requests to other routes or methods
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
}

module.exports = router;