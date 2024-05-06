const path = require('path');
const { handlePayment } = require(path.join(__dirname, "../tools/payment_tools.js"));

const router = (req, res) => {
    if (req.method === 'POST') {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
        });
        req.on('end', () => {
            // Parse the body and set it on the request object
            try {
                let body = JSON.parse(data);
                // Extract the payment method from the URL
                const paymentMethod = req.url.split('/')[2];
                if (paymentMethod) {
                    // Pass the request, response, and payment method to handlePayment
                    handlePayment(body, res, paymentMethod);
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ success: false, message: 'Payment method not specified' }));
                }
            } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
                return;
            }
        })
    } else {
        // Default response for non-matching routes or methods
        res.statusCode = 404;
        res.end(JSON.stringify({ success: false, message: 'Not found' }));
    }
}

module.exports = router;