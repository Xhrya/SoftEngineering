const path = require('path');
const fs = require('fs');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {

	let { url } = req;
	if (url.includes('/helpdesk/employee')) {
		// Parse the URL to extract query parameters
		let auth_token = null;
		const urlParts = url.split('?');
		if (urlParts.length > 1) {
			const query = urlParts[1];
			const queryParams = new URLSearchParams(query);
			auth_token = queryParams.get('token');
		}
		 if (auth_token !=null) {
		 	account_tools.verify(auth_token)
		 		.then((data) => {
		 			if (data.role == 1) {
						if (req.method === 'GET') {
							try {
								// Validate each entry and hash password
								let obj = {
									"Tickets": null,
									"Questions": null,
									"role": null
								};
	
								// Take tickets and order them by ticket_id
								let q = `SELECT * FROM Ticket WHERE status = ? ORDER BY ticket_id`;
								db.all(q, ['unresolved'], (err, results) => {
									// Handle error
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										if (results.length > 0) {
											obj.Tickets = results;
											obj.role = 1;
										}
									}
								});
	
								const r = `SELECT * FROM Questions`;
								db.all(r, (err, results) => {
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										fs.readFile('frontpage.html', (err, frontpageData) => {
											if (err) {
												res.writeHead(500, { 'Content-Type': 'text/plain' });
												res.end('Server error');
											} else {
											obj.Questions = results;
												const jsonData = JSON.stringify(obj);
	
												// Embed the JSON data into the HTML response
												const htmlResponse = `
													<script id="server-data" type="application/json">${jsonData}</script>
													${frontpageData.toString()}
												`;
												// Send frontpage.html content as response
												res.end(htmlResponse);
											}
										});
									}
								});
							} catch (e) {
								// Error JSON
								res.writeHead(400, { 'Content-Type': 'text/plain' });
								res.end('Error parsing JSON data!');
							}
						} else {
						
							
							res.writeHead(405, { 'Content-Type': 'text/plain' });
							res.end('Wrong method type');
						}
					}
				 });
		 } else {
		
			res.writeHead(401, { 'Content-Type': 'text/plain' });
		 					res.end('Unauthorized User');
		 }
		
			} else if (url == '/helpdesk/user') {
				if (req.method === 'GET') {
					let obj = { "Questions": null, "Tickets": null, "Role": null, "User_id": null, "frontpageData": null }; // Initialize obj outside the try block
					try {
						let auth_token = req.headers['authorization'];
			
						if (auth_token) {
							account_tools.verify(auth_token)
								.then((data) => {
									if (data.role == 2 || data.role == 3) {
										const q = `SELECT * FROM Ticket WHERE user_id = ?`;
										// db query for Tickets
										db.all(q, [data.user_id], (err, results) => {
											if (err) {
												res.writeHead(500, { 'Content-Type': 'text/plain' });
												res.end('Server error');
											} else {
												obj.Tickets = results;
												obj.Role = data.role;
												obj.User_id = data.user_id;
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
								fs.readFile('frontpage.html', (err, frontpageData) => {
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										obj.Questions = results;
										const jsonData = JSON.stringify(obj);
        
										// Embed the JSON data into the HTML response
										const htmlResponse = `
											<script id="server-data" type="application/json">${jsonData}</script>
											${frontpageData.toString()}
										`;
										// Send frontpage.html content as response
																
										res.end(htmlResponse);
									}
								});
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
			} else if(url == ('/helpdesk/sort')){
					if (req.method === 'POST') {
						let data = '';
						req.on('data', (chunk) => {
							data += chunk
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(data);
								let {
									sort,
									role,
									user_id,
								} = body;
								let obj = { "Tickets": null };
								if(role == 2 || role == 3){
									const q = `SELECT * FROM Ticket WHERE user_id = ? ORDER BY ${sort}`;
									db.all(q, [user_id], function(err,result) {
	   
										if (err) {
											res.writeHead(500, { 'Content-Type': 'text/plain' });
											res.end('Server error');
										} else {
											res.writeHead(200, { 'Content-Type': 'text/plain' });
											obj.Tickets = result;
											res.end(JSON.stringify(obj));
										}
									})
								}else{
								
									const q = `SELECT * FROM Ticket ORDER BY ${sort}`;
									db.all(q, function(err,result) {
	   
										if (err) {
											res.writeHead(500, { 'Content-Type': 'text/plain' });
											res.end('Server error');
										} else {
											res.writeHead(200, { 'Content-Type': 'text/plain' });
											obj.Tickets = result;
											res.end(JSON.stringify(obj));
										}
									})
								}
						
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
					}
					else if (url === '/helpdesk') {
						if (req.method === 'GET') {
							// Serve the login page HTML
							fs.readFile('helpdeskSignup.html', (err, loginPage) => {
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Internal Server Error');
								} else {
									res.writeHead(200, { 'Content-Type': 'text/html' });
									res.end(loginPage);
								}
							});
						} else {
							// Invalid HTTP method
							res.writeHead(405, { 'Content-Type': 'text/plain' });
							res.end('Wrong method type');
						}
								
	}else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('This URL is not found.');
		
	}
}
	


module.exports = router;