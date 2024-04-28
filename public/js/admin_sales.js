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

async function sales_processing(data) {
    if (data.success) {
        if (data.records.length > 0) {
            let sales = data.records;
            for (let i = 0; i < sales.length; i++) {
                let row = document.createElement('tr');

		    let order_id = document.createElement('td');
		    order_id.textContent = sales[i].order_id;

                let items = document.createElement('td');
                items.textContent = sales[i].items;
                
                let status = document.createElement('td');
                status.textContent = sales[i].status;

                let total_price = document.createElement('td');
        	total_price.textContent = sales[i].total_price;

		    let seller = document.createElement('td');
		    let seller_a = document.createElement('a');
		    seller_a.href = `/admin/user_analytics?user_id=${sales[i].seller}`
		    seller_a.textContent = sales[i].seller;
		    seller.appendChild(seller_a);

		    let customer = document.createElement('td');
		    let customer_a = document.createElement('a');
		    customer_a.href = `/admin/user_analytics?user_id=${sales[i].customer}`;
		    customer_a.textContent = sales[i].customer;
		    customer.appendChild(customer_a);


		    row.appendChild(order_id);
                row.appendChild(items);
                row.appendChild(status);
                row.appendChild(total_price);
		    row.appendChild(seller);
		    row.appendChild(customer);

                document.querySelector("#sales_list").appendChild(row);
            }
        } else {
            sales_message.textContent = 'No sales :(';
        }
    } else {
        sales_message.textContent = 'Unable to load sales!';
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

                    auth_request_get(
                        '/account/view_sales',
                        auth
                    )
                    .then((data) => {
                        sales_processing(data);
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
