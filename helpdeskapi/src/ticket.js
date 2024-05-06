const url_lib = require('url');
const path = require('path');
const fs = require('fs');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let { url } = req;
	urlparse = url.split('/');
			//verify admin role
		if (url == "/ticket/create") {
				//now process routes
				
				if (req.method === 'POST') {
					let data = '';
					req.on('data', (chunk) => {
						data += chunk
					})
					req.on('end', () => {
						try {
							let body = JSON.parse(data);
							let {
								user_id,
								Email,
								role,
								ticket_category,
								ticket_Subcategory,
								Order_id,
								TicketProblem_id,
								Response,
								description
							} = body;
							let q = `INSERT INTO Ticket (user_id, email, role, ticket_category, ticket_subcategory, Order_id, TicketProblem_id, response, STATUS, description) 
							VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
							db.run(q, [user_id, role, Email, ticket_category, ticket_Subcategory, Order_id, TicketProblem_id, Response, 'unresolved', description], function(err) {
				
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Server error');
								} else {
									const ticketId = this.lastID;
									res.writeHead(200, { 'Content-Type': 'application/json' });
									res.end(JSON.stringify({ticket_id: ticketId }));
								}
								
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
				}
					else if (url.startsWith("/ticket/createinfo")) {
						// Serve a different HTML page for the new route
						if (req.method === 'GET') {
			
							fs.readFile('createTicket.html', (err, data) => {
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Server error');
								} else {
									res.writeHead(200, { 'Content-Type': 'text/html' });
									res.end(data);
								}
							});
						} else {
							res.writeHead(405, { 'Content-Type': 'text/plain' });
							res.end('Wrong method type');
						}
				} else if (urlparse.length==4) {
					if (urlparse[1] == 'ticket' && urlparse[3] == 'update'){
					if (req.method === 'PATCH') {  
						let data = '';
						req.on('data', (chunk) => {
							data += chunk;
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(data);
								let {
									STATUS,
									Response,
									flag

								} = body;
								if(flag != null){
									let q = `UPDATE Ticket SET Flag_status = ?, time = datetime('now', 'localtime') WHERE ticket_id = ?`;
								let values = [flag, urlparse[2]];
								db.run(q, values, function(err) {
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
								}
								else if(Response != null){
								let q = `UPDATE Ticket SET time = datetime('now', 'localtime'), Response = ? WHERE ticket_id = ?`;
								let values = [Response, urlparse[2]];
								db.run(q, values, function(err) {
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
							} else {
								let q = `UPDATE Ticket SET STATUS = ?, time = datetime('now', 'localtime')  WHERE ticket_id = ?`;
								let values = [STATUS, urlparse[2]];
								db.run(q, values, function(err) {
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
				}else if (urlparse.length == 3) {
					if(urlparse[2]!='create') {
					if (req.method === 'GET') {  
							try {
								const ticket_id = urlparse[2].split('?')[0]; // Extracts everything before the '?'
								
                // Extract role from the query parameters
                			const queryParams = urlparse[2].split('?')[1]; // Extracts everything after the '?'
                			const role = new URLSearchParams(queryParams).get('role');
							let obj = {"Ticket":null , "role":role};
								let q = `SELECT * FROM Ticket WHERE ticket_id = ?`;
								db.all(q, ticket_id, (err, results) => {
									//handle error
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										fs.readFile('viewTicket.html', (err, viewData) => {
											if (err) {
												res.writeHead(500, { 'Content-Type': 'text/plain' });
												res.end('Server error');
											} else {
												obj.Ticket = results;
												const jsonData = JSON.stringify(obj);
				
												// Embed the JSON data into the HTML response
												const htmlResponse = `
													<script id="jsonData" type="application/json">${jsonData}</script>
													${viewData.toString()}
												`;
												// Send frontpage.html content as response
																		
												res.end(htmlResponse);
											}
										});
									}
								})
							} catch(e) {
								//error with JSON
								res.writeHead(400, { 'Content-Type': 'text/plain' });
								res.end('Error parsing JSON data!');
							}
					} else {
						res.writeHead(405, { 'Content-Type': 'text/plain' });
						res.end('Wrong method type');
					}
				}
				}  else {
					res.writeHead(404, { 'Content-Type': 'text/plain' });
					res.end('This URL is not found.');
				}
			} 
	

module.exports = router;
