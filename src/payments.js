require('dotenv').config({ path: '../cred.env' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fetch = require('node-fetch');
const db = require('../db/db.js'); // Ensure this path is correct

// Function to process Stripe payments
async function processStripePayment(req, res) {
    const { amount, source, seller_account, patron_account, payment_id } = req.body;

    if (!amount || !source || !seller_account || !patron_account || !payment_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Missing required fields in the request." }));
        return;
    }

    if (amount <= 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Invalid payment amount" }));
        return;
    }

    try {
        const charge = await stripe.charges.create({
            amount,
            currency: 'usd',
            source,
            description: 'Stripe Payment',
        });

        await logTransaction({
            payment_id,
            transaction_id: charge.id,
            amount: charge.amount,
            currency: charge.currency,
            payment_method: 'Stripe',
            status: charge.status,
            seller_account,
            patron_account,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, charge }));
    } catch (error) {
        console.error('Stripe payment error:', error);

        // Distinguish between Stripe-specific and other types of errors
        if (error.type === 'StripeCardError') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message }));
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Stripe payment processing failed." }));
        }
    }
}

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

        await logTransaction({
            payment_id: null,  // Generate or retrieve a payment ID for PayPal transaction
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
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: error.toString() }));
    }
}

// Logs or updates transactions in the database
async function logTransaction({ payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account }) {
    const checkQuery = `SELECT * FROM transactions WHERE transaction_id = ? OR payment_id = ?`;
    try {
        const existing = await new Promise((resolve, reject) => {
            db.get(checkQuery, [transaction_id, parseInt(payment_id)], (error, row) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(row);
                }
            });
        });

        if (existing) {
            const updateQuery = `UPDATE transactions SET status = ? WHERE transaction_id = ? OR payment_id = ?`;
            await new Promise((resolve, reject) => {
                db.run(updateQuery, [status, transaction_id, parseInt(payment_id)], function(error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
            console.log(`Transaction updated successfully with ID: ${existing.id}`);
            return existing.id;
        } else {
            const insertQuery = `
                INSERT INTO transactions
                (payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const transactionId = await new Promise((resolve, reject) => {
                db.run(insertQuery, [
                    parseInt(payment_id), 
                    transaction_id, 
                    parseFloat(amount), 
                    currency, 
                    payment_method, 
                    status, 
                    seller_account, 
                    patron_account
                ], function(error) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
            console.log(`Transaction logged successfully with ID: ${transactionId}`);
            return transactionId;
        }
    } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
    }
}

// Function to handle refunds for Stripe transactions
async function handleRefund(req, res) {
    const { transaction_id } = req.body;
    if (!transaction_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Transaction ID is required for a refund." }));
        return;
    }

    try {
        const refund = await stripe.refunds.create({
            charge: transaction_id
        });

        await logTransaction({
            transaction_id,
            status: 'refunded',
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, refund }));
    } catch (error) {
        console.error('Refund failed:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: "Refund operation failed." }));
    }
}

// Function to handle payment routing
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

module.exports = { processStripePayment, processPaypalPayment, handlePayment, handleRefund };
