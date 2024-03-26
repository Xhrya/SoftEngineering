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
					let email = body.email;
				
					let q = `SELECT * FROM User WHERE email = '${email}'`;
					db.get(q, (err, results) => {
						//handle error
						if (err) {
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							res.end('Server error');
						} else {
							if (results != null) {
								//should store hashed passwords using crypto js
					
									//login successful
									let obj = {
										username: results.username, 
										email: results.email,
										role: results.role
									}
									//return token we should set time limit
									let token = jwt.sign(obj, process.env.JWT_SECRET);
									//write response header
									res.writeHead(200, { 'Content-Type': 'text/plain' });
									res.end(token);
		
							} else {
								//username not exist :(
								res.writeHead(401, { 'Content-Type': 'text/plain' });
								res.end('Account does not exist');
							}
						}
					})
				} catch(e) {
					//invalid JSON body
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
				}
			})
		} else {
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
		}
	} else if (url == '/account/create/user') {

					if (req.method === 'POST') {
						let req_body = '';
						req.on('data', (chunk) => {
							req_body += chunk;
						})
						req.on('end', () => {
							try {
								let obj;
								let body = JSON.parse(req_body);
								let {
									username,
									name, 
									description,
									category,
									street_address,
									email,
									password,
									role,
								} = body;
								//validate each entry and hash password
								let q = `INSERT INTO User (username, name, email, password, status, role) VALUES (?, ?, ?, ?, 'active', ?)`;
								db.run(q, [username, name, email, password, role], (err, results) => {
									//handle error
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										obj = { success: true };
	
									}
								})
								if (role == 2) {
									let x = `SELECT * FROM User WHERE username = ?`; 
									db.get(x, [username], (err, user) => {
										if (err) {
											res.writeHead(500, { 'Content-Type': 'text/plain' });
											res.end('Server error');
										} else {
											let z = `UPDATE Seller SET name = ?, description = ?, category = ?, street_address = ? WHERE seller_id = ?`; 
											db.run(z, [name, description, category, street_address, user.user_id], (updateErr) => {
												if (updateErr) {
													res.writeHead(500, { 'Content-Type': 'text/plain' });
													res.end('Server error');
												} else {
													obj = { success: true };
													
												}
											});
										}
									});
								}
								res.writeHead(200, { 'Content-Type': 'text/plain' });
								res.end(JSON.stringify(obj));
							} catch(e) {
								//error JSON
								res.writeHead(400, { 'Content-Type': 'text/plain' });
								res.end('Error parsing JSON data!');
							}
						})
					} else {
						//wrong method
						res.writeHead(405, { 'Content-Type': 'text/plain' });
						res.end('Wrong method type');
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
						res.writeHead(400, { 'Content-Type': 'text/plain' });
						res.end('Token invalid.');
					})
				} catch(e) {
					//error with JSON
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Error parsing JSON data!');
				}
			})
		} else {
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
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
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										let obj = { success: true };
										res.writeHead(200, { 'Content-Type': 'text/plain' });
										res.end(JSON.stringify(obj));
									}
								})
							} catch(e) {
								//error JSON
								res.writeHead(400, { 'Content-Type': 'text/plain' });
								res.end('Error parsing JSON data!');
							}
						})
					} else {
						//wrong method
						res.writeHead(405, { 'Content-Type': 'text/plain' });
						res.end('Wrong method type');
					}
				} else {
					//unauthorized
					res.writeHead(401, { 'Content-Type': 'text/plain' });
					res.end('Unauthorized User');
				}
			})
			.catch((error) => {
				//error with token signout user
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				res.end('Token invalid.');
			})
		} else {
			res.writeHead(401, { 'Content-Type': 'text/plain' });
			res.end('Authorization not provided.');
		}
	} else if (url == '/account/view_sales') {
		let auth_token = req.headers['authorization'];
		if (auth_token) {
			account_tools.verify(auth_token)
			.then((data) => {
				if (data.role == 0) {
					if (req.method === 'GET') {
						let records = [];
						let q = `SELECT * FROM Orders`;
						db.query(q, (err, results) => {
							if (err) {
								res.writeHead(500, { 'Content-Type': 'text/plain' });
								res.end('Server error');
							} else {
								if (results.length > 0) {
									for (let i = 0; i < results.length; i++) {
										records.push(results[i]);
										if (i + 1 == results.length) {
											res.writeHead(200, { 'Content-Type': 'text/plain' })
											res.end(JSON.stringify({ success: true, records: records }));
										}
									}
								} else {
									res.writeHead(200, { 'Content-Type': 'text/plain' });
									res.end('No order records');
								}
							}
						})
					} else {
						//wrong method
						res.writeHead(405, { 'Content-Type': 'text/plain' });
						res.end('Wrong method type');
					}
				} else {
					//unauthorized
					res.writeHead(401, { 'Content-Type': 'text/plain' });
					res.end('Unauthorized User');
				}
			})
			.catch((error) => {
				//signout user bad token
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				res.end('Token invalid.');
			})
		} else {
			//unauthorized
			res.writeHead(401, { 'Content-Type': 'text/plain' });
			res.end('Authorization not provided');
		}			
	} else if (url == '/account/generate_summary_report') {
		if (req.method === 'POST') {
			let auth_token = req.headers['authorization'];
			if (auth_token) {
				account_tools.verify(auth_token)
				.then((data) => {
					if (data.role == 0) {
						let req_body = '';
						req.on('data', (chunk) => {
							req_body += chunk;
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(req_body);
								if (body.user_id && body.account_type) {
									account_tools.generate_sales_report(body.user_id, body.account_type)
									.then((sales_data) => {
										res.writeHead(200, { 'Content-Type': 'text/plain' });
										res.end(JSON.stringify(sales_data));
									})
									.catch((error) => {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									})
								} else {
									res.writeHead(400, { 'Content-Type': 'text/plain' });
									res.end('Missing fields');
								}
							} catch(e) {
								res.writeHead(400, { 'Content-Type': 'text/plain' });
								res.end('Error parsing JSON data!');
							}
						})
					} else {
						res.writeHead(401, { 'Content-Type': 'text/plain' });
						res.end('Unauthorized User');
					}
				})
				.catch((error) => {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Token invalid.');
				})
			} else {
				res.writeHead(401, { 'Content-Type': 'text/plain' });
				res.end('Authorization not provided');
			}
		} else {
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			res.end('Wrong method type');
		}
	} else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('This URL is not found.');
	}
}

module.exports = router;