let auth;

const welcome = document.querySelector("#admin");

const flag_table = document.querySelector("#flag_table");
const flag_message = document.querySelector("#flag_message");

async function post(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return response.json()
}
async function auth_request_get(url = '', token = '') {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
    })
    return response.json()
}

async function auth_request_put(url = '', token = '', data = {}) {
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token
        },
	body: JSON.stringify(data)
    })
    return response.json()
}

function get_cookie(name) {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

function delete_cookie(name) {
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

function ban_user(user_id, element) {
	flag_message.textContent = '';
	auth_request_put('/ban', auth, { user_id: user_id })
	.then((data) => {
		if (data.success) {
			element.disabled = true;
		} else {
			flag_message.textContent = 'Issue with banning try again.';
		}
	})
}

function flags_processing(data) {
    if (data.success) {
        if (data.flags.length > 0) {
            let flags = data.flags;
            for (let i = 0; i < flags.length; i++) {
                let row = document.createElement('tr');

                let id = document.createElement('td');
                id.textContent = flags[i].flag_id;
                
                let comment = document.createElement('td');
                comment.textContent = flags[i].comment;

                let status = document.createElement('td');
                status.textContent = flags[i].status;

		let ban_cell = document.createElement('td');
		let ban_button = document.createElement('button');
		    ban_button.textContent = 'Ban';
		    ban_button.addEventListener('click', () => { ban_user(flags[i].user_id, ban_button) })
		    ban_cell.appendChild(ban_button);

		    let ack_cell = document.createElement('td');
		    let ack_button = document.createElement('button');
		    ack_button.textContent = 'Acknowledge';
		    ack_button.addEventListener('click', () => { acknowledge_flag(flags[i].flag[i]) })
		    ack_cell.appendChild(ack_button);

                row.appendChild(id);
                row.appendChild(comment);
                row.appendChild(status);
		    row.appendChild(ban_cell);
		    row.appendChild(ack_cell);

                document.querySelector("#flag_list").appendChild(row);
            }
        } else {
            flag_message.textContent = 'No flags to worry about :)';
        }
    } else {
        flag_message.textContent = 'Unable to load flags!';
    }
}

window.onload = () => {
    auth = get_cookie('user');
    if (auth) {
        post('/account/verify', { token: auth })
        .then((data) => {
            if (data.success) {
                if (data.user.role === 0) {
                    welcome.textContent = data.user.username;

                    //request for flags
                    auth_request_get(
                        '/flags/view',
                        auth
                    )
                    .then((data) => {
                        flags_processing(data);
                    })
                } else {
                    window.location.href = "/";
                }
            } else {
                delete_cookie('user');
                window.location.href = "/account/admin_login/view";
            }
        })
    } else {
        window.location.href = "/account/admin_login/view";
    }
}
