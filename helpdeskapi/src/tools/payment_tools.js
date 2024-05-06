const path = require('path');
const stripe = require('stripe');
const fetch = require('node-fetch');

const db = require(path.join(__dirname, "./db.js"));
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

const handlePayment = async (body, res, paymentMethod) => {
    if (paymentMethod === 'stripe') {
        await processStripePayment(body, res);
    } else if (paymentMethod === 'paypal') {
        await processPaypalPayment(body, res);
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Unsupported payment method' }));
    }
}

// Function to process Stripe payments
const processStripePayment = async (body, res) => {
    const { amount, source, seller_account, patron_account, payment_id } = body;

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
    let q = `SELECT * FROM Transactions WHERE payment_id = ${payment_id}`;
    db.all(q, async (error, results) => {
        if (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: "Internal server error." }));
        } else {
            if (results.length > 0) {
                res.writeHead(409, { 'Content-Type': 'application/json' }); // 409 Conflict
                res.end(JSON.stringify({ success: false, message: "Transaction with this payment ID already exists." }));
            } else {
                try {
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
                } catch(e) {
                    // Distinguish between Stripe-specific and other types of errors
                    if (e.type === 'StripeCardError') {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, message: e.message }));
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
                            // Respond with error
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: "Stripe payment processing failed." }));
                        } catch (logError) {
                            console.error('Failed to log transaction:', logError);
                        }     
                    }
                } 
            }
        }
    })
}

const processPaypalPayment = async (body, res) => {
    const { amount, seller_account, patron_account } = body;


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

const logTransaction = async (data) => {
    let { 
            payment_id, 
            transaction_id, 
            amount, 
            currency, 
            payment_method, 
            status, 
            seller_account, 
            patron_account 
    } = data;
 
    // If the transaction does not exist, insert a new record
    const query = `
        INSERT INTO Transactions
        (payment_id, transaction_id, amount, currency, payment_method, status, seller_account, patron_account)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    return new Promise((resolve, reject) => {
        db.run(query, [parseInt(payment_id), transaction_id, parseFloat(amount), currency, payment_method, status, parseInt(seller_account), parseInt(patron_account)], function(error) {
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

const getValidAccessToken = async () => {
    const clientID = process.env.PAYPAL_CLIENTID;
    const secret = process.env.PAYPAL_SECRET;


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

module.exports = {
    handlePayment: handlePayment,
    processStripePayment: processStripePayment,
    processPaypalPayment: processPaypalPayment
}