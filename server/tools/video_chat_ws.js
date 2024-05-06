const path = require('path');
const ws = require('ws');

const generate_id = () => {
    let length = 5;
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

const client_list = new Map()

function broadcast(message) {
	client_list.forEach((client, id) => {
		let client_socket = client.socket;
		if (client_socket.readyState === ws.OPEN) {
			client_socket.send(message);
		}
	})
}

module.exports.handler = (socket) => {
	let id, name;

	socket.on('message', (data) => {
		let message = data.toString();
		let message_obj = JSON.parse(message);

		if (message_obj.type == 'login') {
			name = message_obj.name;
			id = generate_id();
			client_list.set(id, { id: id, socket: socket, name: name });
			let obj = {
				type: 'login_ack',
				id: id,
				name: name
			}
			broadcast(JSON.stringify(obj))
		} else if (message_obj.type == 'clients_request') {
			let connected_clients = Array.from(client_list.values());
			let sender = client_list.get(message_obj.id);
			let obj = {
				type: 'clients',
				list: connected_clients
			}
			sender.socket.send(JSON.stringify(obj));
		} else if (message_obj.type == 'call_request') {
			let sender = client_list.get(message_obj.from);
			let receiver = client_list.get(message_obj.to);
			let obj = {
				type: 'call_request',
				offer: message_obj.offer,
				caller_name: sender.name,
				caller_id: sender.id
			}
			receiver.socket.send(JSON.stringify(obj));
		} else if (message_obj.type == 'answer') {
			let sender = client_list.get(message_obj.from);
			let receiver = client_list.get(message_obj.to);
			let obj = {
				type: 'answer',
				answer: message_obj.answer,
				acceptor_name: sender.name,
				acceptor_id: sender.id
			}
			receiver.socket.send(JSON.stringify(obj));
		} else if (message_obj.type == 'decline') {
			let sender = client_list.get(message_obj.from);
			let receiver = client_list.get(message_obj.to);
			let obj = {
				type: 'decline',
				decliner_name: sender.name,
				decliner_id: sender.id
			}
			receiver.socket.send(JSON.stringify(obj));
		} else if (message_obj.type == 'new_ice_candidate') {
			let sender = client_list.get(message_obj.from);
			let receiver = client_list.get(message_obj.to);
			let obj = {
				type: 'new_ice_candidate',
				candidate: message_obj.candidate,
				candidate_from_name: sender.name,
				candidate_from_id: sender.id
			}
			receiver.socket.send(JSON.stringify(obj));
		}
	})
	
	socket.on('close', () => {
		client_list.delete(id);
		let obj = {
			type: 'logout_ack',
			id: id,
			name: name
		}
		broadcast(JSON.stringify(obj));
		console.log(`${id} has disconnected :(!`);
	})
}