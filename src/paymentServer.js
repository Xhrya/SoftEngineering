// At the very top of server.js
require('dotenv').config({ path: 'cred.env' });
//console.log(process.env.STRIPE_SECRET_KEY);
const http = require('http');
const { URL } = require('url');
const { handlePayment } = require('./payments.js'); // Adjust the path as necessary

const port = 3000;

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
   // Prepare for JSON responses
  res.setHeader('Content-Type', 'application/json');


  // Handling POST requests for payments
  if (req.method === 'POST' && reqUrl.pathname.startsWith('/payments/')) {
      let body = '';
      req.on('data', chunk => {
          body += chunk.toString();
      });
      req.on('end', () => {
          // Parse the body and set it on the request object
          try {
              req.body = JSON.parse(body);
          } catch (error) {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
              return;
          }
        
          // Extract the payment method from the URL
          const paymentMethod = reqUrl.pathname.split('/')[2];
          if (paymentMethod) {
              // Pass the request, response, and payment method to handlePayment
              handlePayment(req, res, paymentMethod);
          } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ success: false, message: 'Payment method not specified' }));
          }
      });
  } else {
      // Default response for non-matching routes or methods
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, message: 'Not found' }));
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
