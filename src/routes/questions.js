const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let { url } = req;
	if (url.includes ('/questions/create')) {
		let auth_token = req.headers['authorization'];
			if (auth_token) {
			account_tools.verify(auth_token)
			.then((data) => {
				//verify admin role or helpdesk role
				if (data.role == 1 || data.role == 0) {
					//handle routes
						if (req.method === 'POST') {
							let data = '';
							req.on('data', (chunk) => {
								data += chunk
							})
							req.on('end', () => {
								try {
									let body = JSON.parse(data);
									let {
										question, 
										answer
									} = body;
									let q = `INSERT INTO Questions (question, answer) VALUES (?, ?)`;
									db.query(q, [question,answer], (err, results) => {
										//handle error
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
				//token invalid signout
				res.writeHead(400, { 'Content-Type': 'text/plain' });
				res.end('Token invalid.');
			})
		} else {
			//unauthorized
			res.writeHead(401, { 'Content-Type': 'text/plain' });
			res.end('Authorization not provided.');
		}
	}else if(url == `/questions/update`){
		let auth_token = req.headers['authorization'];
			if (auth_token) {
			account_tools.verify(auth_token)
			.then((data) => {
				//verify admin role or helpdesk role
				if (data.role == 1 || data.role == 0) {
					//handle routes
						if (req.method === 'POST') {
							let data1 = '';
							req.on('data', (chunk) => {
								data1 += chunk
							})
							req.on('end', () => {
								try {
									let body = JSON.parse(data1);
									let {
										question_id,
										question, 
										answer,
										Task
									} = body;
									let q;
									if (Task == 'update') {
										q = `UPDATE Questions SET question = ?, answer = ? WHERE question_id = ?`;
										db.query(q, [question, answer, question_id], (err, results) => {
											if (err) {
												res.writeHead(500, { 'Content-Type': 'text/plain' });
												res.end('Server error');
											} else {
												let obj = { success: true };
												res.writeHead(200, { 'Content-Type': 'text/plain' });
												res.end(JSON.stringify(obj));
											}
										});
									} else {
										q = `DELETE FROM Questions WHERE question_id = ?`;
										db.query(q, [question_id], (err, results) => {
					
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
							
								}} catch(e) {
									//error with JSON
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
		} else {
			//unauthorized
			res.writeHead(401, { 'Content-Type': 'text/plain' });
			res.end('Authorization not provided.');
		} 
	}else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('This URL is not found.');
	}
}

	module.exports = router;