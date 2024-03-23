const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const router = (req, res) => {
	let { url } = req;
	let auth_token = req.headers['authorization'];
	if (auth_token) {
		account_tools.verify(auth_token)
		.then((data) => {
			//check admin
			if (data.role == 0) {
				if (url = '/admin/view_all_users') {
					if (req.method === 'GET') {
						let q = `SELECT * FROM User`;
						db.query(q, (err, results) => {
							//handle error
							if (err) {
								res.writeHead(500, { 'Content-Type': 'text/plain' });
								res.end('Server error');
							} else {
								res.writeHead(200, { 'Content-Type': 'text/plain' });
								let obj = {
									users: results
								}
								res.end(JSON.stringify(obj));
							}
						})
					} else {
						//bad method
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
			//error with token verification signout
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			res.end('Token invalid.');
		})
	} else {
		//no token
		res.writeHead(401, { 'Content-Type': 'text/plain' });
		res.end('Authorization not provided.');
	}
}

module.exports = router;
