const url_lib = require('url');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

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
								role,
								ticket_category,
								description
							} = body;
							let q = `INSERT INTO Ticket (user_id, role, ticket_category, time, STATUS, description) VALUES (?, ?, ?, datetime('now'), ?, ?)`;
							db.run(q, [user_id, role, ticket_category, 'unresolved', description], function(err) {
   
								if (err) {
									res.writeHead(500, { 'Content-Type': 'text/plain' });
									res.end('Server error');
								} else {
									res.writeHead(200, { 'Content-Type': 'text/plain' });
									res.end(JSON.stringify({ success: true }));
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
									description
								} = body;
								let q = `UPDATE Ticket SET STATUS = ?, time = datetime('now', 'localtime'), description = ? WHERE ticket_id = ?`;
								let values = [STATUS, description, urlparse[2]];
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
								let q = `SELECT * FROM Ticket WHERE ticket_id = ?`;
								db.get(q, [urlparse[2]], (err, results) => {
									//handle error
									if (err) {
										res.writeHead(500, { 'Content-Type': 'text/plain' });
										res.end('Server error');
									} else {
										res.writeHead(200, { 'Content-Type': 'text/plain' });
										res.end(JSON.stringify(results));
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
