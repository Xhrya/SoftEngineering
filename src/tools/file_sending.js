const fs = require('fs');

const send_response = (res, data) => {
    res.writeHead(data.code, { 'Content-Type': data.content_type });
    res.end(data.m);
}

const send_file = (view_route, type) => {
	return new Promise((resolve, reject) => {
        fs.readFile(view_route, (err, data) => {
            if (err) {
                reject({
                    code: 500,
                    content_type: type,
                    m: 'Error reading HTML file, please try again.'
                })
            } else {
                resolve({ 
                    code: 200,
                    content_type: type,
                    m: data
                })
            }
        });
    })
}

const send_json_res = (res, data) => {
	res.writeHead(data.code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data.m));
}

module.exports = {
    send_file, 
    send_response,
    send_json_res
}
