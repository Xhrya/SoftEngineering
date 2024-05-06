const url_lib = require('url');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let { url } = req;

	let auth_token = req.headers['authorization'];
	if (auth_token) {
		account_tools.verify(auth_token)
		.then((data) => {
			//verify admin role
			if (data.role == 0) {
				//now process routes
				
				if (url.includes('/flags/view')) {
					if (req.method === 'GET') {
						let params = url_lib.parse(url, true).query;
						let q;
						if (params.flag_id) {
							q = `SELECT * FROM Flag WHERE flag_id = ${params.flag_id}`;
						} else {
							q = `SELECT * FROM Flag`;
						}
						db.all(q, (err, results) => {
							//handle error
							if (err) {
								res.writeHead(500, { 'Content-Type': 'text/plain' });
								res.end('Server error');
							} else {
								let obj = { flags: results };
								res.writeHead(200, { 'Content-Type': 'text/plain' });
								res.end(JSON.stringify(obj));
							}
						})
					} else {
						res.writeHead(405, { 'Content-Type': 'text/plain' });
						res.end('Wrong method type');
					}
				} else if (url == '/flags/warn') {
					if (req.method === 'POST') {
						let data = '';
						req.on('data', (chunk) => {
							data += chunk;
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(data);
								let {
									comment, 
									user_id,
									reason //reason not being handled tho in mysql maybe add column
								} = body;
								let q = `INSERT INTO Flag VALUES (default, '${comment}', ${user_id}, 'CONFIRMED', 0)`;
								db.run(q, (err, results) => {
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
				} else {
					res.writeHead(404, { 'Content-Type': 'text/plain' });
					res.end('This URL is not found.');
				}
			} else {
				//unauthorized
				res.writeHead(401, { 'Content-Type': 'text/plain' });
				res.end('Unauthorized User');
			}
		})
		.catch((error) => {
			//invalid token
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			res.end('Token invalid.');
		})
	} else {
		//no auth token
		res.writeHead(401, { 'Content-Type': 'text/plain' });
		res.end('Authorization not provided.');
	}
}

module.exports = router;
