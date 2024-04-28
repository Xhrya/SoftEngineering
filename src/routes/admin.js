const path = require('path');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));
const { send_file, send_response, send_json_res } = require(path.join(__dirname, "../tools/file_sending.js"));

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
								send_json_res(res, {
									code: 500,
									m: { success: false }
								})
							} else {
								send_json_res(res, {
									code: 200,
									m: {
										success: true,
										users: results
									}
								})
							}
						})
					} else {
						//bad method
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
			//error with token verification signout
			res.writeHead(400, { 'Content-Type': 'text/plain' });
			res.end('Token invalid.');
		})
	} else {
		if (url == '/admin/dashboard') {
			let file = path.join(__dirname, "../../templates/views/admin_dashboard.html");
			send_file(file, 'text/html')
			.then((data) => {
				send_response(res, data);
			})
			.catch((error) => {
				send_response(res, error);
			})
		} else {
			//no token
			res.writeHead(401, { 'Content-Type': 'text/plain' });
			res.end('Authorization not provided.');
		}
	}
}

module.exports = router;
