require('dotenv').config({ path: 'cred.env' });
const http = require('http');
const { URL } = require('url');
const { handlePayment, handleRefund, handleDispute } = require('./payments.js'); // Assuming these functions are exported from payments.js

const port = 3000;

const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Collecting data chunks
        });
        req.on('end', () => {
            try {
                req.body = JSON.parse(body); // Parsing the JSON body
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                return;
            }

            // Handling different POST endpoints
            if (reqUrl.pathname.startsWith('/payments/')) {
                const paymentMethod = reqUrl.pathname.split('/')[2];
                if (paymentMethod) {
                    handlePayment(req, res, paymentMethod);
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ success: false, message: 'Payment method not specified' }));
                }
            } else if (reqUrl.pathname === '/refund') {
                handleRefund(req, res, req.body);
            } else if (reqUrl.pathname === '/dispute') {
                handleDispute(req, res, req.body);
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ success: false, message: 'Not found' }));
            }
        });
    } else {
        // Default response for non-POST methods
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
    }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
