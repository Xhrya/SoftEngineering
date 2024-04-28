const url_lib = require('url');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));
const { send_file, send_response, send_json_res } = require(path.join(__dirname, "../tools/file_sending.js"));


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
						if (err) {
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							let obj = {
								success: false, 
								message: 'Server error'
							}
							res.end(JSON.stringify(obj));
						} else {
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
									res.writeHead(200, { 'Content-Type': 'text/plain' });
									res.end(JSON.stringify({ success: true, token: token }));
								} else {
									//password not match
									res.writeHead(401, { 'Content-Type': 'text/plain' });
									let obj = {
										success: false,
										message: 'Wrong password'
									}
									res.end(JSON.stringify(obj));
								}
							} else {
								//username not exist :(
								res.writeHead(401, { 'Content-Type': 'text/plain' });
								let obj = {
									success: false,
									message: 'Account does not exist'
								}
								res.end(JSON.stringify(obj));
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
	} else if (url == '/account/admin_login/view') {
		let file = path.join(__dirname, "../../templates/views/admin_login.html");
		send_file(file, 'text/html')
		.then((data) => {
			send_response(res, data);
		})
		.catch((error) => {
			send_response(res, error);
		})
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
					let q = `INSERT INTO User (username, email, password, status, role) VALUES (?, ?, ?, 'active', ?)`;
					db.query(q, [username, email, password, role], (err, results) => {
						//handle error
						if (err) {
							//console.log('hello', err);
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							res.end('Server error');
						} else {
							obj = { success: true };

						}
					})
					if (role == 2) {
						let x = `SELECT * FROM User WHERE username = ?`; 
						db.query(x, [username], (err, user) => {
							if (err) {
								console.log(err);
								res.writeHead(500, { 'Content-Type': 'text/plain' });
								res.end('Server error');
							} else {
								if (user.length > 0) {
									let z = `UPDATE Seller SET name = ?, description = ?, category = ?, street_address = ? WHERE seller_id = ?`; 
									db.query(z, [name, description, category, street_address, user.user_id], (updateErr) => {
										if (updateErr) {
											console.log(updateErr);
											res.writeHead(500, { 'Content-Type': 'text/plain' });
											res.end('Server error');
										} else {
											obj = { success: true };
											res.writeHead(200, { 'Content-Type': 'text/plain' });
											res.end(JSON.stringify(obj));
										}
									});
									console.log(user)

								} else {
									console.log('hello');
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Server error');
								}
							}
						});
					}
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
						let o = {
							success: true, 
							user: data
						}
						res.end(JSON.stringify(o));
					})
					.catch((error) => {
						//handle error
						res.writeHead(400, { 'Content-Type': 'text/plain' });
						let o = {
							success: false,
							message: 'Token invalid.'
						}
						res.end(JSON.stringify(o));
					})
				} catch(e) {
					//error with JSON
					let o = {
						success: false,
						message: 'JSON error'
					}
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end(JSON.stringify(o));
				}
			})
		} else {
			res.writeHead(405, { 'Content-Type': 'text/plain' });
			let o = {
				success: false,
				message: 'Wrong method type'
			}
			res.end(JSON.stringify(o));
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
										res.writeHead(500, { 'Content-Type': 'text/plain' })
										res.end('Server error')
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
								send_json_res(res, {
									code: 500,
									m: {
										success: false,
										message: 'Server error'
									}
								})
							} else {
								if (results.length > 0) {
									for (let i = 0; i < results.length; i++) {
										records.push(results[i]);
										if (i + 1 == results.length) {
											send_json_res(res, {
												code: 200,
												m: {
													success: true,
													records: records
												}
											})
										}
									}
								} else {
									send_json_res(res, {
										code: 200,
										m: {
											success: true,
											records: ''
										}
									})
								}
							}
						})
					} else {
						//wrong method
						send_json_res(res, {
							code: 405,
							m: {
								success: false
							}
						})
					}
				} else {
					//unauthorized
					send_json_res(res, {
						code: 401,
						m: {
							success: false
						}
					})
				}
			})
			.catch((error) => {
				//signout user bad token
				send_json_res(res, {
					code: 400,
					m: {
						success: false
					}
				})
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
