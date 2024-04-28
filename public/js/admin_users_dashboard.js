let auth;

const welcome = document.querySelector("#admin");
const user_table = document.querySelector("#user_table");
const user_message = document.querySelector("#user_message");

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
        }
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

function get_query_param() {
	let q_string = window.location.search;
	let params = new URLSearchParams(q_string);
	return params;
}

function users_processing(data) {
    if (data.success) {
        if (data.users.length > 0) {
            user_table.style.display = "block";
            let users = data.users;
            for (let i = 0; i < users.length; i++) {
                let row = document.createElement('tr');

		    let id = document.createElement('td');
		    id.textContent = users[i].user_id;

                let username = document.createElement('td');
                username.textContent = users[i].username;
                
                let email = document.createElement('td');
                email.textContent = users[i].email;

                let role = document.createElement('td');
                role.textContent = users[i].role;

		    let status = document.createElement('td');
		    status.textContent = users[i].status;

		    let analytics = document.createElement('td');
		    let analytics_a = document.createElement('a');;
		    analytics_a.href = `/admin/user_analytics?user_id=${users[i].user_id}`;
		    analytics_a.textContent = 'Analytics';
		    analytics.appendChild(analytics_a);

		    row.appendChild(id);
                row.appendChild(username);
                row.appendChild(email);
                row.appendChild(role);
		    row.appendChild(status);
		    row.appendChild(analytics);

                document.querySelector("#user_list").appendChild(row);
            }
        } else {
            sales_message.textContent = 'No users :(';
        }
    } else {
        sales_message.textContent = 'Unable to load users!';
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

			    //request users
			    auth_request_get(
				'/admin/view_all_users',
				auth
			    )
			    .then((data) => {
				users_processing(data);
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
