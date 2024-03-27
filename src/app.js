const path = require('path');
const http = require('http');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, "../../env/cred.env") });

const port = process.env.PORT;

const admin_routes = require(path.join(__dirname, "./routes/admin.js"));
const account_routes = require(path.join(__dirname, "./routes/account.js"));
const flag_routes = require(path.join(__dirname, "./routes/flag.js"));
const ban_routes = require(path.join(__dirname, "./routes/ban.js"));
const gpt_routes = require(path.join(__dirname, "./routes/gpt.js"));
const payment_routes = require(path.join(__dirname, "./routes/payments.js"));
const search_routes = require(path.join(__dirname, "./routes/search.js"));
// const ticket_routes = require(path.join(__dirname, "./routes/ticket.js"));
// const helpdesk_routes = require(path.join(__dirname, "./routes/helpdesk.js"));
// const questions_routes = require(path.join(__dirname, "./routes/questions.js"));

const server = http.createServer((req, res) => {
	//retrieve 'url' hitting the server
	let { url } = req;
	//get resource 
	let route = url.split('/')[1];

	if (route == 'account') {
		account_routes(req, res);
	} else if (route == 'admin') {
		admin_routes(req, res);
	} else if (route == 'flags') {
		flag_routes(req, res);
	} else if (route == 'ban') {
		ban_routes(req, res);
	} else if (route == 'gpt') {
		gpt_routes(req, res);
	} else if (route == 'payments') {
		payment_routes(req, res);
	} else if (route == 'search') {
		search_routes(req, res);
	} else if (route == '') {
		fs.readFile(path.join(__dirname, '../templates/views/google_login.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading googlelogin.html file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
	} else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('This URL is not found.');		
	}
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})
