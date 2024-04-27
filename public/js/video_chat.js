const ws = new WebSocket("ws://3.94.158.251");

const login_div = document.querySelector("#login");
const name_input = document.querySelector("#name");
const enter_button = document.querySelector("#enter");
const instructions_p = document.querySelector("#instructions");
const contacts_div = document.querySelector("#contacts");
const caller_div = document.querySelector("#call_alert");
const caller_p = document.querySelector("#caller_message");
const calling_button_div = document.querySelector("#calling_buttons");
const accept_button = document.querySelector("#accept");
const decline_button = document.querySelector("#decline") 
const calling_div = document.querySelector("#calling_alert");
const calling_p = document.querySelector("#calling_message");
const caller_id_input = document.querySelector("#caller_id");
const caller_name_input = document.querySelector("#caller_name");
const offer_input = document.querySelector("#offer");
const talk_div = document.querySelector("#talk");
const call_video = document.querySelector("#call_video");

let id, name, configuration, peer_connection;
contacts_div.style.display = "none";

configuration = {'iceServers': [
	{urls: 'stun:stun.l.google.com:19302'} 
]}
peer_connection = new RTCPeerConnection(configuration);

async function make_call(to_id, to_name) {
	const offer = await peer_connection.createOffer();
	await peer_connection.setLocalDescription(offer);
	let obj = {
		type: 'call_request',
		to: to_id,
		from: id,
		offer: offer
	}
	ws.send(JSON.stringify(obj));
	calling_p.textContent = `Calling ${to_name}...`;
	calling_div.style.display = "block";
}

function remove_contact(client_id) {
	if (id) {
		document.querySelector(`#${client_id}`).remove();
	}
}

function new_contact(obj) {
	let button = document.createElement('button');
	button.textContent = obj.name;
	button.id = obj.id;
	button.addEventListener('click', (e) => { make_call(obj.id, obj.name) })

	contacts_div.appendChild(button);
}

function add_contact(data) {
	if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			if (data[i].id != id) {
				new_contact(data[i]);
			}
		}
	} else {
		if (data.id != id) {
			new_contact(data);
		}
	}
}

enter_button.addEventListener('click', async (e) => {
	let local_stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
	local_stream.getTracks().forEach((track) => {
		peer_connection.addTrack(track, local_stream)
	})
	peer_connection.addEventListener('track', async (e) => {
		const [remote_stream] = e.streams;
		call_video.srcObject = remote_stream;
	})
	if (name_input.value) {
		let obj = {
			name: name_input.value,
			type: 'login'
		}
		ws.send(JSON.stringify(obj));
		login_div.style.display = "none";
		contacts_div.style.display = "block";
	} else {
		instructions_p.textContent = 'Please enter name first.';
	}
})

accept_button.addEventListener('click', async () => {
	let offer_obj = JSON.parse(offer_input.value);
	peer_connection.setRemoteDescription(offer_obj);
	const answer = await peer_connection.createAnswer();
	await peer_connection.setLocalDescription(answer)
	let obj = {
		type: 'answer',
		answer: answer,
		from: id,
		to: caller_id_input.value
	}
	ws.send(JSON.stringify(obj));
	caller_p.textContent = 'Connecting...';
	calling_button_div.style.display = "none";
	
	console.log('finding ice candidates');
	peer_connection.addEventListener('icecandidate', (e) => {
		if (e.candidate) {
			let obj = {
				type: 'new_ice_candidate',
				from: id,
				to: caller_id_input.value,
				candidate: e.candidate
			}
			ws.send(JSON.stringify(obj));
		}
	})

	peer_connection.addEventListener('connectionstatechange', (e) => {
		if (peer_connection.connectionState === 'connected') {
			console.log('Call connected!');
			caller_div.style.display = "none";
		}
	})

})

decline_button.addEventListener('click', () => {
	let obj = {
		type: 'decline',
		from: id,
		to: caller_id_input.value
	}
	ws.send(JSON.stringify(obj));
	caller_div.style.display = "none";
	calling_button_div.style.display = "none";
})

ws.addEventListener('open', (e) => {
	console.log('Client connected!');
	//ws.send('hello from client :)');
})

ws.addEventListener('message', async (e) => {
	let message_obj = JSON.parse(e.data);
	if (message_obj.type == 'login_ack') {
		if (!id) {
			id = message_obj.id;
			name = message_obj.name;
			//console.log('Connected as', name, id);
			let obj = {
				type: 'clients_request',
				id: id
			}
			ws.send(JSON.stringify(obj));
		} else {
			//console.log(message_obj.name, message_obj.id, 'has joined!');
			add_contact(message_obj);
		}
	} else if (message_obj.type == 'logout_ack') {
		//console.log(message_obj.name, message_obj.id, 'has logged out :(!');	
		remove_contact(message_obj.id);
	} else if (message_obj.type == 'clients') {
		//console.log(message_obj.list);
		add_contact(message_obj.list);
	} else if (message_obj.type == 'call_request') {
		//console.log(`Call from ${message_obj.caller_name}, ${message_obj.caller_id}`);
		if (message_obj.offer) {
			offer_input.value = JSON.stringify(message_obj.offer);
			caller_id_input.value = message_obj.caller_id;
			caller_name_input.value = message_obj.caller_name;
			caller_p.textContent = `Incoming call from ${message_obj.caller_name}`;
			caller_div.style.display = "block";
			calling_button_div.style.display = "block";
		} else {
			let obj = {
				type: 'decline',
				from: id,
				to: message_obj.caller_id
			}
			ws.send(JSON.stringify(obj));
		}
	} else if (message_obj.type == 'answer') {
		if (message_obj.answer) {
			let remote_desc = new RTCSessionDescription(message_obj.answer);
			await peer_connection.setRemoteDescription(remote_desc);
			calling_p.textContent = 'Connecting...';

			console.log('finding ice candidates');
			peer_connection.addEventListener('icecandidate', (e) => {
				if (e.candidate) {
					let obj = {
						type: 'new_ice_candidate',
						from: id,
						to: caller_id_input.value,
						candidate: e.candidate
					}
					ws.send(JSON.stringify(obj));
				}
			})

			peer_connection.addEventListener('connectionstatechange', (e) => {
				if (peer_connection.connectionState === 'connected') {
					console.log('Call connected!');
					calling_div.style.display = "none";
				}
			})
		} else {
			calling_p.textContent = 'Call failed.';
			setTimeout(() => {
				calling_div.style.display = "none";
			}, 5000);
		}
	} else if (message_obj.type == 'decline') {	
		calling_p.textContent = 'Call declined.';
		setTimeout(() => {
			calling_div.style.display = "none";
		}, 5000);
	} else if (message_obj.type == 'new_ice_candidate') {
		if (message_obj.candidate) {
			try {
				await peer_connection.addIceCandidate(message_obj.candidate);
			} catch(error) {
				console.log('Error:', error);
			}
		}
	}
})