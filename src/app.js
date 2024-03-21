const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, "../cred.env") });

const port = process.env.PORT;

const admin_routes = require(path.join(__dirname, "./routes/admin.js"));
const account_routes = require(path.join(__dirname, "./routes/account.js"));
const flag_routes = require(path.join(__dirname, "./routes/flag.js"));
const ban_routes = require(path.join(__dirname, "./routes/ban.js"));

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
	} else {
		res.end('Welcome to MunchMate!');
	}
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})
