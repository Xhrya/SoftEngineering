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
								db.query(q, (err, results) => {
									//handle error
									if (err) throw err;
									res.end(JSON.stringify({ success: true }));
								})
							} catch(e) {
								//error with JSON
							}
						})
					} else {
						//wrong method
					}
				}
			} else {
				//unauthorized
			}
		})
		.catch((error) => {
			//token invalid signout
		})
	} else {
		//unauthorized
	}
}

module.exports = router;
