const url_lib = require('url');
const path = require('path');
const fs = require('fs');

const db = require(path.join(__dirname, "../tools/db.js"));
const account_tools = require(path.join(__dirname, "../tools/account_tools.js"));

const text_content = 'text/plain';
const response = (res, data) => {
    res.writeHead(data.code, { 'Content-Type': data.content_type });
    res.end(data.m);
}

const get_resource = (request_url) => {
    let parsed_url = url_lib.parse(request_url, true);
	let resource = parsed_url.pathname.split('/video_chat/')[1];
	return resource;
}

const view_route = (req) => {
    return new Promise((resolve, reject) => {
        let video_chat_view = path.join(__dirname, "../../templates/views/video_chat.html");
        open_view(video_chat_view)
        .then((res) => {
            resolve(res);
        })
        .catch((error) => {
            reject(error);
        })
    })
}

const resource_table = {
    view: view_route
}

const open_view = (view_route) => {
    return new Promise((resolve, reject) => {
        fs.readFile(view_route, (err, data) => {
            if (err) {
                console.log(err);
                reject({
                    code: 500,
                    content_type: text_content,
                    m: 'Error reading HTML file, please try again.'
                })
            } else {
                resolve({ 
                    code: 200,
                    content_type: 'text/html',
                    m: data
                })
            }
        });
    })
}




const router = (req, res) => {
    let auth_token = req.headers['authorization'];
    if (auth_token) {
        account_tools.verify(auth_token)
        .then((data) => {
            if (data.role == 0) {
                let resource = get_resource(req.url);
                if (resource_table[resource]) {
                    resource_table[resource](req)
                    .then((data) => {
                        response(res, data);
                    })
                    .catch((err) => {
                        if (err.code) {
                            response(res, err)
                        } else {
                            response(res, { 
                                code: 500,
                                content_type: 'text/plain',
                                m: err
                            })
                        }
                    })
                } else {
                    response(res, {
                        code: 404,
                        content_type: text_content,
                        m: 'This URL is not found.'
                    })
                }
            } else {
                response(res, {
                    code: 401,
                    content_type: text_content,
                    m: 'Unauthorized User'
                })
            }
        })
        .catch((error) => {
            console.log(error);
            response(res, {
                code: 400,
                content_type: text_content,
                m: 'Token invalid.'
            })
        })
    } else {
        response(res, {
            code: 401,
            content_type: text_content,
            m: 'Authorization not provided.'
        })
    }
}

module.exports = router;