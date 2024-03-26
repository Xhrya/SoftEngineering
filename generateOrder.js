const http = require('http');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const dbPath = path.join(__dirname, 'order.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database:', dbPath);
    }
});

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);

    // Check if the request is for the '/order/generation' endpoint and if it's a POST request
    if (parsedUrl.pathname === '/order/generation' && req.method === 'POST') {
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
                const query = 'INSERT INTO Orders (customer, seller, items, status, total_price) VALUES (?, ?, ?, ?, ?)';

                db.run(query, [customer, seller, items, status, total_price], function(err) {
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
        });
    } else {
        // Handle requests to other routes or methods
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
