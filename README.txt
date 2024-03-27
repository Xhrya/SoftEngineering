What does the code do?
Payments.js is the main code file that processes payment requests. It uses the Stripe API to process the payments, taking in the amount required for the order going through and using inputted payment information. In place of real credit card information, Stripe provides tokens that simulate acceptable credit cards. This code already checks for any missing data or duplicate payment requests.

Before running the code, ensure that there is a table in the database present, or you can create one, called TRANSACTIONS

- To run the code: ensure that you are root directory and type into the terminal `node ./src/paymentServer.js`
- Then to simulate payments, use Postman to send HTTP requests.

IF YOU WANT TO TEST STRIPE PAYMENTS:
-  URL to send requests to should be: `http://localhost:3000/payments/stripe`
- Method type should be POST
- Headers should include: `Key: Content-Type` and Value: `application/json`
- Body should contain: (Notes: Stripe counts money in cents; refer to the tables in this webpage for testing tokens for Stripe payments: `https://docs.stripe.com/testing`)
{
  "amount": "INTEGER",
  "source": "tok_visa_declined",
  "seller_account": "seller",
  "patron_account": "patron",
  "payment_id": "INTEGER"
}

IF YOU WANT TO TEST PAYPAL PAYMENTS:
- URL to send requests to should be "`http://localhost:3000/payments/paypal`
- Same method type and headers as stripe requests
- Body should contain: (Note: Unlike Stripe, Paypal is normal and registers money as dollars and cents)
{
    "amount": "FLOAT",
    "seller_account": "seller@example.com",
    "patron_account": "buyer@example.com"
}
- IMPORTANT: Once the request sends and goes through, you will be given a redirect URL to a login page where you will sign in using a sandbox account provided by Paypal's developer dashboard, assuming you have already made an account with them.
