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
							let obj = {
								users: results
							}
							res.end(JSON.stringify(obj));
						})
					} else {
						//bad method
					}	
				} else {
					//bad route
				}
			} else {
				//unauthorized
			}
		})
		.catch((error) => {
			//error with token verification signout
		})
	}
}

module.exports = router;
