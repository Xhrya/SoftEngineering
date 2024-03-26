const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let { url } = req;
	if (url == '/helpdesk/employee') {
		let auth_token = req.headers['authorization'];
		if (auth_token) {
		account_tools.verify(auth_token)
			.then((data) => {
			if(data.role==1){
			if (req.method === 'GET') {
				try {
							//validate each entry and hash password
							let obj = {"ALL_Active_tickets" : null, 
										"Questions" : null};
							//Take tickets and order them by ticket_id
							let q = `SELECT * FROM Ticket WHERE status = ? ORDER BY ticket_id`;
							db.all(q, ['unresolved'], (err, results) => {
									//handle error
							if (err) throw err;
							if (err) {
								res.writeHead(500, { 'Content-Type': 'text/plain' });
								res.end('Server error');

								//show ticket list
							} else {
								if (results.length > 0) {
										obj.ALL_Active_tickets = results;
										
									}
								}
							});
							
							const r = `SELECT * FROM Questions`;
							db.all(r, (err, results) => {
							if (err) {
							res.writeHead(500, { 'Content-Type': 'text/plain' });
							res.end('Server error');
						} else {
							obj.Questions = results;
							res.writeHead(200, { 'Content-Type': 'application/json' });
							res.end(JSON.stringify(obj));
						}
					});
							
					
					}
					catch(e) {
						//error JSON
						res.writeHead(400, { 'Content-Type': 'text/plain' });
						res.end('Error parsing JSON data!');
					}
				} else {
					//unauthorized
					res.writeHead(401, { 'Content-Type': 'text/plain' });
					res.end('Unauthorized User');
				}
				}
				})
				} else {
					//bad method
					res.writeHead(405, { 'Content-Type': 'text/plain' });
					res.end('Wrong method type');
				}
			} else if(url == ('/helpdesk/user')){

				if (req.method === 'GET') {
					let obj = { "Questions": null, "Tickets": null }; // Initialize obj outside the try block
					try {
						let auth_token = req.headers['authorization'];
				
						if (auth_token) {
							account_tools.verify(auth_token)
								.then((data) => {
									if (data.role == 2 || data.role == 3) {
										const q = `SELECT * FROM Ticket WHERE user_id = ?`;
										// db query for Tickets
										db.all(q, [data.seller_id], (err, results) => {
											if (err) {
												res.writeHead(500, { 'Content-Type': 'text/plain' });
												res.end('Server error');
											} else {
												obj.Tickets = results;
											}
										});
									}
								})
								.catch((error) => {
									// Handle verification error
									res.writeHead(401, { 'Content-Type': 'text/plain' });
									res.end('Unauthorized');
								});
						}
						const r = `SELECT * FROM Questions`;
									db.all(r, (err, results) => {
									if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Server error');
								} else {
									obj.Questions = results;
									res.writeHead(200, { 'Content-Type': 'application/json' });
									res.end(JSON.stringify(obj));
								}
							});
					} catch (e) {
						// Error parsing JSON data
						res.writeHead(400, { 'Content-Type': 'text/plain' });
						res.end('Error parsing JSON data!');
					}
				} else {
					// Bad method
					res.writeHead(405, { 'Content-Type': 'text/plain' });
					res.end('Wrong method type');
				}
				
	}else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('This URL is not found.');
		
	}
}
	


module.exports = router;