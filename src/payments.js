const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const db = require('../db/db.js'); // Ensure this path is correct


// Logs successful transactions to the table in the database titled TRANSACTIONS
// Also checks for duplicate transactions and will not log duplicates
async function logTransaction({ payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account }) {
    const checkQuery = `SELECT * FROM transactions WHERE payment_id = ?`;
    let existing;
    try {
        existing = await new Promise((resolve, reject) => {
            db.get(checkQuery, [payment_id], (error, row) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(row);
                }
            });
        });
    } catch (error) {
        console.error('Failed to check for duplicate transaction:', error);
        throw new Error('Database operation failed.');
    }
 
    if (existing) {
        console.log('Transaction with this payment ID already exists.');
        return existing.id; // Return the existing transaction ID if it already exists
    }
 
    // If the transaction does not exist, insert a new record
    const query = `
        INSERT INTO transactions
        (payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        db.run(query, [payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account], function(error) {
            if (error) {
                console.error('Failed to log transaction:', error);
                reject(error);
            } else {
                console.log('Transaction logged successfully with ID:', this.lastID);
                resolve(this.lastID);
            }
        });
    });
 }


// Function to process Stripe payments
async function processStripePayment(req, res) {
    const { amount, source, seller_account, patron_account, payment_id } = req.body;

    // Check for missing required fields
    if (!amount || !source || !seller_account || !patron_account || !payment_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Missing required fields in the request." }));
        return;
    }

    // Check for invalid payment amount
    if (amount <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Invalid payment amount" }));
        return;
    }

    // Check for duplicate payment ID
    try {
        const existingTransaction = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM transactions WHERE payment_id = ?`, [payment_id], (error, row) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(row);
                }
            });
        });

        if (existingTransaction) {
            res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
            res.end(JSON.stringify({ success: false, message: "Transaction with this payment ID already exists." }));
            return;
        }
    } catch (dbError) {
        console.error('Database error:', dbError);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Internal server error." }));
        return;
    }

    try {
        // Proceed with Stripe charge creation
        const charge = await stripe.charges.create({
            amount,
            currency: 'usd',
            source,
            description: 'Stripe Payment',
        });

        // Log the successful transaction
        await logTransaction({
            payment_id,
            transaction_id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            payment_method: 'Stripe',
            status: charge.status, // Succeeded
            seller_account,
            patron_account,
        });

        // Respond with success
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, charge }));
    } catch (error) {
        console.error('Stripe payment error:', error);

        // Distinguish between Stripe-specific and other types of errors
        if (error.type === 'StripeCardError') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message }));
        } else {
            // Attempt to log the failed transaction
            try {
                await logTransaction({
                    payment_id,
                    transaction_id: null, // No transaction ID available due to failure
                    amount: amount,
                    currency: 'usd',
                    payment_method: 'Stripe',
                    status: 'failed', // Mark as failed
                    seller_account,
                    patron_account,
                });
            } catch (logError) {
                console.error('Failed to log transaction:', logError);
            }

            // Respond with error
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Stripe payment processing failed." }));
        }
    }
}



// Function to handle PayPal payment initiation
async function processPaypalPayment(req, res) {
   const { amount, seller_account, patron_account } = req.body;


   try {
       const accessToken = await getValidAccessToken();
       const response = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${accessToken}`,
           },
           body: JSON.stringify({
               intent: 'CAPTURE',
               purchase_units: [{
                   amount: {
                       currency_code: 'USD',
                       value: amount,
                   },
               }],
           }),
       });


       if (!response.ok) {
           throw new Error(`PayPal payment initiation failed: ${await response.text()}`);
       }


       const data = await response.json();
       const approvalUrl = data.links.find(link => link.rel === 'approve').href;


       // Log the successful transaction
       await logTransaction({
           payment_id: null, // Generate or retrieve a payment ID for PayPal transaction
           transaction_id: data.id,
           amount,
           currency: 'USD',
           payment_method: 'PayPal',
           status: 'CREATED',
           seller_account,
           patron_account,
       });


       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ success: true, redirectUrl: approvalUrl }));
   } catch (error) {
       console.error('PayPal payment initiation error:', error);


       // Log the failed transaction
       await logTransaction({
           payment_id: null, // Generate or retrieve a payment ID for the failed PayPal transaction
           transaction_id: null, // No transaction ID available
           amount,
           currency: 'USD',
           payment_method: 'PayPal',
           status: 'failed', // Mark as failed
           seller_account,
           patron_account,
       });


       res.writeHead(500, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ success: false, message: error.toString() }));
   }
}

// Handler for payment routing
async function handlePayment(req, res, paymentMethod) {
  if (paymentMethod === 'stripe') {
      await processStripePayment(req, res);
  } else if (paymentMethod === 'paypal') {
      await processPaypalPayment(req, res);
  } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Unsupported payment method' }));
  }
}
      


// Function for getting a valid PayPal access token
async function getValidAccessToken() {
   const clientID = 'AQ29P2-ZnNa0u22xVARCH5i1cumkG3aL0r-oCe-vc0Kkqqf3U3URDgHOPJRUHGtyVaO4OwDZb18ef7z0';
   const secret = 'EDZv8IaAx8SL0LlGm7Z833DH61HSc5NFCANF33f5oDCENVkyDMp7bIROukLsxObvFJ1mgxlAxtE1Hhzf';


   const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/x-www-form-urlencoded',
           'Authorization': 'Basic ' + Buffer.from(clientID + ':' + secret).toString('base64'),
       },
       body: 'grant_type=client_credentials',
   });


   const data = await response.json();
   if (!response.ok) {
       throw new Error(`Failed to retrieve access token: ${data.error_description}`);
   }


   return data.access_token;
}

module.exports = { processStripePayment, processPaypalPayment, handlePayment };




