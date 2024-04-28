const form = document.querySelector("#f")
const username_input = document.querySelector("#username");
const password_input = document.querySelector("#password");
const message = document.querySelector("#message");

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

function set_cookie(name, value) {
    const date = new Date();
    //30 minute cookie
    date.setTime(date.getTime() + (30 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    let obj = {
        username: username_input.value,
        password: password_input.value
    }
    post('/account/login', obj)
    .then((data) => {
        if (data.success) {
            set_cookie('user', data.token);
            window.location.href = "/admin/dashboard";
        } else {
            message.textContent = data.message;
            username_input.value = '';
            password_input.value = '';
        }
    })
})