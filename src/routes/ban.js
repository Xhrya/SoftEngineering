const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));
const { send_json_res } = require(path.join(__dirname, "../tools/file_sending.js"));

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
								} = body;
								let q = `UPDATE User SET status = 'ban' WHERE user_id = ${user_id}`;
								db.query(q, (err, results) => {
									//handle error
									if (err) {
										send_json_res(res, { 
											code: 500,
											m: { success: false }
										})
									} else {
										send_json_res(res, {
											code: 200,
											m: {
												success: true
											}
										})
									}
								})
							} catch(e) {
								send_json_res(res, {
									code: 400,
									m: {
										success: false
									}
								})
							}
						})
					} else {
						//wrong method
						send_json_res(res, {
							code: 405,
							m: { success: false }
						})
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
