const url_lib = require('url');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

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
					account_tools.verify(body.token)
					.then((data) => {
						res.writeHead(200, { 'Content-Type': 'application/json' });
						res.end(JSON.stringify(decoded));
					})
					.catch((error) => {
						//handle error
					})
				} catch(e) {
					//error with JSON
					console.log(e);
				}
			})
		}
	} else if (url == '/account/create') {
		//check if user is signed in first and verify admin permission
		let auth_token = req.headers['authorization'];
		if (auth_token) {
			account_tools.verify(auth_token)
			.then((data) => {
				if (data.role == 0) {
					if (req.method === 'POST') {
						let req_body = '';
						req.on('data', (chunk) => {
							req_body += chunk;
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(req_body);
								let {
									username, 
									password,
									email,
									role
								} = body;
								//validate each entry and hash password
								let q = `INSERT INTO User VALUES (default, '${username}', '${email}', '${password}', 'active', ${role})`; 
								db.query(q, (err, results) => {
									//handle error
									if (err) throw err;
									let obj = { success: true };
									res.end(JSON.stringify(obj));
								})
							} catch(e) {
								//error JSON
							}
						})
					} else {
						//wrong method
					}
				} else {
					//unauthorized
				}
			})
			.catch((error) => {
				//error with token signout user
			})
		}
	} else if (url.includes('/account/view?')) {
		//THIS IS FOR ORDERS NOT VIEWING ACCOUNT DETAILS
		let auth_token = req.headers['authorization'];
		if (auth_token) {
			account_tools.verify(auth_token)
			.then((data) => {
				if (data.role == 0) {
					if (req.method === 'GET') {
						let parsed_url = url_lib.parse(req.url, true);
						let query_params = parsed_url.query;
						if (query_params.user_id) {
							let q = `SELECT * FROM User WHERE user_id = '${query_params.user_id}'`;
							db.query(q, (err, results) => {
								//handle err
								if (err) throw err;
								if (results.length > 0) {
									let obj = results[0];
									res.end(JSON.stringify(obj));
								} else {
									//bad user id
								}		
							})
						} else {
							//user_id not specified
						}	
					} else {
						//wrong method
					}
				} else {
					//unauthorized
				}
			})
			.catch((error) => {
				//signout user bad token
			})
		} else {
			//unauthorized
		}			
	}
}

module.exports = router;
