const path = require('path');
const http = require('http');
const fs = require('fs');
const ws = require('ws');
require('dotenv').config({ path: path.join(__dirname, "../../env/cred.env") });

const port = process.env.PORT;

const admin_routes = require(path.join(__dirname, "./routes/admin.js"));
const account_routes = require(path.join(__dirname, "./routes/account.js"));
const flag_routes = require(path.join(__dirname, "./routes/flag.js"));
const ban_routes = require(path.join(__dirname, "./routes/ban.js"));
const gpt_routes = require(path.join(__dirname, "./routes/gpt.js"));
const payment_routes = require(path.join(__dirname, "./routes/payments.js"));
const search_routes = require(path.join(__dirname, "./routes/search.js"));
const seller_routes = require(path.join(__dirname, "./routes/seller.js"));
const ticket_routes = require(path.join(__dirname, "./routes/ticket.js"));
const helpdesk_routes = require(path.join(__dirname, "./routes/helpdesk.js"));
const questions_routes = require(path.join(__dirname, "./routes/questions.js"));
const order_routes = require(path.join(__dirname, "./routes/orders.js"));
const cart_routes = require(path.join(__dirname, "./routes/cart.js"));
const video_chat_routes = require(path.join(__dirname, "./routes/video_chat.js"));

const video_chat_wss = require(path.join(__dirname, "./tools/video_chat_ws.js"));

const send_file = (view_route, type) => {
	return new Promise((resolve, reject) => {
        fs.readFile(view_route, (err, data) => {
            if (err) {
                reject({
                    code: 500,
                    content_type: text_content,
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

const send_response = (res, data) => {
	console.log(data);
	res.writeHead(data.code, { 'Content-Type': data.content_type });
    res.end(data.m);
}

const server = http.createServer((req, res) => {
	//retrieve 'url' hitting the server
	let { url } = req;
	//get resource 
	let route = url.split('/')[1];

	if (route == 'account') {
		account_routes(req, res);
	} else if (route == 'admin') {
		admin_routes(req, res);
	} else if (route == 'flags') {
		flag_routes(req, res);
	} else if (route == 'ban') {
		ban_routes(req, res);
	} else if (route == 'gpt') {
		gpt_routes(req, res);
	} else if (route == 'payments') {
		payment_routes(req, res);
	} else if (route == 'search') {
		search_routes(req, res);
	} else if (route == 'orders') {
		order_routes(req, res);
	} else if (route == 'seller') {
		seller_routes(req, res);
	} else if (route == 'questions') {
		questions_routes(req, res);
	} else if (route == 'ticket') {
		ticket_routes(req, res);
	} else if (route == 'helpdesk') {
		helpdesk_routes(req, res);
	} else if (route == 'cart') {
		cart_routes(req, res);
	} else if (route == '') {
		fs.readFile(path.join(__dirname, '../templates/views/google_login.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading googlelogin.html file');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
	} else if (route == 'video_chat') {
		video_chat_routes(req, res);
	} else if (route == 'video_chat.js') {
		let file = path.join(__dirname, "../public/js/video_chat.js");
		send_file(file, 'application/javascript')
		.then((data) => {
			send_response(res, data);
		})
		.catch((err) => {
			send_response(res, err);
		})
	} else if (route == 'video_chat.css') {
		let file = path.join(__dirname, "../public/css/video_chat.css");
		send_file(file, 'text/css')
		.then((data) => {
			send_response(res, data);
		})
		.catch((err) => {
			send_response(res, err);
		})
	} else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('This URL is not found.');		
	} 
})

const wss = new ws.WebSocketServer({ noServer: true });
wss.on('connection', video_chat_wss.handler);

server.on('upgrade', (request, socket, head) => {
	wss.handleUpgrade(request, socket, head, (socket) => {
		wss.emit('connection', socket, request);
	})
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
})
