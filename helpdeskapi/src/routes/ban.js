const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let auth_token = req.headers['authorization'];
	if (auth_token) {
		account_tools.verify(auth_token)
		.then((data) => {
			//verify admin role
			if (data.role == 0) {
				//handle routes
				if (req.url == '/ban') {
					if (req.method === 'PUT') {
						let data = '';
						req.on('data', (chunk) => {
							data += chunk
						})
						req.on('end', () => {
							try {
								let body = JSON.parse(data);
								let {
									user_id, 
									reason
								} = body;
								let q = `UPDATE User SET status = 'ban' WHERE user_id = ${user_id}`;
								db.run(q, (err, results) => {
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
			//token invalid signout
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			res.end('Token invalid.');
		})
	} else {
		//unauthorized
		res.writeHead(401, { 'Content-Type': 'text/plain' });
		res.end('Authorization not provided.');
	}
}

module.exports = router;
