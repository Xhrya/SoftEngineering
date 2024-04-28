let auth;

const welcome = document.querySelector("#admin");
const button = document.querySelector("button");

let data_values = ['username', 'password', 'email'];
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
async function auth_post(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
		'Authorization': auth
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

button.addEventListener('click', (e) => {
	e.preventDefault();

	let m = document.querySelector("#message");

	let obj = {}
	for (let i = 0; i < data_values.length; i++) {
		obj[data_values[i]] = document.querySelector(`#${data_values[i]}`).value;
	}
	auth_post('/account/create_help_desk', obj)
	.then((data) => {
		if (data.success) {
			message.textContent = 'New Help Desk Created!';
		} else {
			message.textContent = 'There was a problem.';
		}
	})
})
window.onload = () => {
    auth = get_cookie('user');
    if (auth) {
        post('/account/verify', { token: auth })
        .then((data) => {
            if (data.success) {
                if (data.user.role === 0) {
                    welcome.textContent = data.user.username;
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
