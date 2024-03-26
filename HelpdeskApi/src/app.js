const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, "../cred.env") });
const fs = require('fs');

const port = process.env.PORT;

const questions_routes = require(path.join(__dirname, "./routes/questions.js"));
const account_routes = require(path.join(__dirname, "./routes/account.js"));
const ticket_routes = require(path.join(__dirname, "./routes/ticket.js"));
const helpdesk_routes = require(path.join(__dirname, "./routes/helpdesk.js"));


const server = http.createServer((req, res) => {
	//retrieve 'url' hitting the server
	let { url } = req;
	//get resource 
	let route = url.split('/')[1];

	if (route == 'account') {
		account_routes(req, res);
	} else if (route == 'questions') {
		questions_routes(req, res);
	} else if (route == 'ticket') {
		ticket_routes(req, res);
	} else if (route == 'helpdesk') {
		helpdesk_routes(req, res);
	} else if (route == 'google') {
		fs.readFile(path.join(__dirname, 'google_login.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading googlelogin.html file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
	} else {
		res.end('Welcome to MunchMate!');
	}
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})
