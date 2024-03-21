const url_lib = require('url');
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
						db.query(q, (err, results) => {
							//handle error
							if (err) throw err;

							let obj = { flags: results };
							res.end(JSON.stringify(obj));
						})
					}
				} else if (url == '/flags/warn') {
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
							db.query(q, (err, results) => {
								//handle error
								if (err) throw err;
								res.end(JSON.stringify({ success: true }));
							})
						} catch(e) {
							//error with JSON
						}
					})
				} 
			} else {
				//unauthorized
			}
		})
		.catch((error) => {
			//invalid token
		})
	} else {
		//no auth token
	}
}

module.exports = router;
