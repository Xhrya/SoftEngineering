const path = require('path');
const url_lib = require('url');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));
const { send_file, send_response, send_json_res } = require(path.join(__dirname, "../tools/file_sending.js"));

const file_sending_response = (file_path, res) => {
    send_file(file_path, 'text/html')
    .then((data) => {
        send_response(res, data);
    })
    .catch((error) => {
        send_response(res, error);
    });
}

const router = (req, res) => {
    let { url } = req;
	let url_parts = url_lib.parse(url, true);
    let auth_token = req.headers['authorization'];
    if (auth_token) {
        account_tools.verify(auth_token)
        .then((data) => {
            if (data.role == 0) { // Admin check
                if (url === '/admin/view_all_users') {
                    if (req.method === 'GET') {
                        let q = `SELECT * FROM User`;
                        db.query(q, (err, results) => {
                            if (err) {
                                send_json_res(res, {
                                    code: 500,
                                    m: { success: false }
                                });
                            } else {
                                send_json_res(res, {
                                    code: 200,
                                    m: {
                                        success: true,
                                        users: results
                                    }
                                });
                            }
                        });
                    } else {
                        send_json_res(res, {
                            code: 405,
                            m: { success: false }
                        });
                    }
		} else if (url_parts.pathname == '/admin/get_user') {
			if (req.method === 'GET') {
				let params = url_lib.parse(url, true).query;
				let { user_id } = params;
				let q = `SELECT * FROM User where user_id = ${user_id}`;
				db.query(q, (err, results) => {
					if (err) {
						send_json_res(res, {
							code: 500, 
							m: { success: false }
						})
					} else {
						if (results.length > 0) {
							send_json_res(res, {
								code: 200,
								m: {
									success: true,
									user: results[0]
								}
							})
						} else {
							send_json_res(res, {
								code: 400,
								m: { success: false }
							})
						}
					}
				})
			} else {
				send_json_res(res, {
				    code: 405,
				    m: { success: false }
				});
			}
                } else if (url === '/admin/view_sales') {
                    if (req.method === 'GET') {
                        let q = `SELECT * FROM Seller`;
                        db.query(q, (err, results) => {
                            if (err) {
                                send_json_res(res, {
                                    code: 500,
                                    m: { success: false }
                                });
                            } else {
                                send_json_res(res, {
                                    code: 200,
                                    m: {
                                        success: true,
                                        sellers: results
                                    }
                                });
                            }
                        });
                    } else {
                        send_json_res(res, {
                            code: 405,
                            m: { success: false }
                        });
                    }
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('This URL is not found.');
                }
            } else {
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Unauthorized User');
            }
        })
        .catch((error) => {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Token invalid.');
        });
    } else {
        if (url === '/admin/dashboard') {
            let file = path.join(__dirname, "../../templates/views/admin_dashboard.html");
            file_sending_response(file, res);
        } else if (url == '/admin/users') {
            let file = path.join(__dirname, "../../templates/views/admin_users_dashboard.html");
            file_sending_response(file, res);
        } else if (url_parts.pathname == '/admin/user_analytics') {
            let file = path.join(__dirname, "../../templates/views/admin_user_analytics.html");
            file_sending_response(file, res);
        } else if (url == '/admin/create_help_desk') {
            let file = path.join(__dirname, "../../templates/views/admin_create_help_desk.html")
            file_sending_response(file, res);
        } else if (url == '/admin/sales') {
            let file = path.join(__dirname, "../../templates/views/admin_sales.html");
		file_sending_response(file, res);
        } else {
            res.writeHead(401, { 'Content-Type': 'text/plain' });
            res.end('Authorization not provided.');
        }
    }
};


module.exports = router;
