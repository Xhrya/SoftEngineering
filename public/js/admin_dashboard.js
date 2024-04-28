let auth;

const welcome = document.querySelector("#admin");

const flag_table = document.querySelector("#flag_table");
const flag_message = document.querySelector("#flag_message");

const sales_table = document.querySelector("#sales_table");
const sales_message = document.querySelector("#sales_message");

const user_table = document.querySelector("#user_table");
const user_message = document.querySelector("#user_message");

//hide these
flag_table.style.display = "none";
sales_table.style.display = "none";
user_table.style.display = "none";

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

function flags_processing(data) {
    if (data.success) {
        if (data.flags.length > 0) {
            flag_table.style.display = "block";
            let flags = data.flags;
            for (let i = 0; i < flags.length; i++) {
                let row = document.createElement('tr');

                let id = document.createElement('td');
                id.textContent = flags[i].flag_id;
                
                let comment = document.createElement('td');
                comment.textContent = flags[i].comment;

                let status = document.createElement('td');
                status.textContent = flags[i].status;

                row.appendChild(id);
                row.appendChild(comment);
                row.appendChild(status);

                document.querySelector("#flag_list").appendChild(row);
            }
        } else {
            flag_message.textContent = 'No flags to worry about :)';
        }
    } else {
        flag_message.textContent = 'Unable to load flags!';
    }
}

function sales_processing(data) {
    if (data.success) {
        if (data.records.length > 0) {
            sales_table.style.display = "block";
            let sales = data.records;
            for (let i = 0; i < sales.length; i++) {
                let row = document.createElement('tr');

                let items = document.createElement('td');
                items.textContent = sales[i].items;
                
                let status = document.createElement('td');
                status.textContent = sales[i].status;

                let total_price = document.createElement('td');
                total_price.textContent = sales[i].total_price;

                row.appendChild(items);
                row.appendChild(status);
                row.appendChild(total_price);

                document.querySelector("#sales_list").appendChild(row);
            }
        } else {
            sales_message.textContent = 'No sales :(';
        }
    } else {
        sales_message.textContent = 'Unable to load sales!';
    }
}

function users_processing(data) {
    if (data.success) {
        if (data.users.length > 0) {
            user_table.style.display = "block";
            let users = data.users;
            for (let i = 0; i < users.length; i++) {
                let row = document.createElement('tr');

                let username = document.createElement('td');
                username.textContent = users[i].username;
                
                let email = document.createElement('td');
                email.textContent = users[i].email;

                let role = document.createElement('td');
                role.textContent = users[i].role;

                row.appendChild(username);
                row.appendChild(email);
                row.appendChild(role);

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

                    //request for flags
                    auth_request_get(
                        '/flags/view',
                        auth
                    )
                    .then((data) => {
                        flags_processing(data);
                    })

                    //request sales
                    auth_request_get(
                        '/account/view_sales',
                        auth
                    )
                    .then((data) => {
                        sales_processing(data);
                    })

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
