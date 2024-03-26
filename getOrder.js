const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const url = require('url');

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

    // Check if the request is for the '/orders' endpoint
    if (parsedUrl.pathname === '/orders' && req.method === 'GET') {
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
