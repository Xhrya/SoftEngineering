const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));

const router = (req, res) => {
	let { url } = req;

	if (url == '/account/login') {
		if (req.method === 'POST') {
			let data = '';
			req.on('data', (chunk) => {
				data += chunk;
			})
			req.on('end', () => {
				try {
					const body = JSON.parse(data);
					//check if all fields are provided
					let username = body.username;
					let password = body.password;

					let q = `SELECT * FROM User WHERE username = '${username}'`;
					db.query(q, (err, results) => {
						//handle error
						if (err) throw err;
						if (results.length > 0) {
							//should store hashed passwords using crypto js
							if (results[0].password == password) {
								//login successful
								let obj = {
									username: username, 
									email: results[0].email,
									role: results[0].role
								}
								//return token we should set time limit
								let token = jwt.sign(obj, process.env.JWT_SECRET);
								//write response header
								res.end(token);
							} else {
								//password not match
							}
						} else {
							//username not exist :(
						}
					})
				} catch(e) {
					//invalid JSON body
					console.log(e);
				}
			})
		}
	} else if (url == '/account/verify') {
		if (req.method === 'POST') {
			let data = '';
			req.on('data', (chunk) => {
				data += chunk;
			})
			req.on('end', () => {
				try {
					let body = JSON.parse(data);
					//verify token and get user data
					jwt.verify(body.token, process.env.JWT_SECRET, (err, decoded) => {
						//handle error (wrong secret, improper format)
						if (err) throw err;
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify(decoded));
					})
				} catch(e) {
					//error with JSON
					console.log(e);
				}
			})
		}
	}
}

module.exports = router;
