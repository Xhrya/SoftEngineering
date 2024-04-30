let auth, user_id, user_type;


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

function get_user_data() {
	auth_request_get(`/admin/get_user?user_id=${user_id}`, auth)
	.then((data) => {
		if (data.success) {
			if (data.user.role == 2 || data.user.role == 3) {
				if (data.user.role == 2) {
					user_type = 'seller';
					get_seller_report();
				} else if (data.user.role == 3) {
					user_type = 'patron';
					get_patron_report();
				}
				else if(data.user.role == 0)
				{
					user_type = 'admin';
					get_overall_analytics_report() 
				}
				else if(data.user.role == 1)
				{
					user_type = 'helpdesk';
					get_overall_analytics_report() 
				}
				populate_user_data(data.user);
			} else {
				populate_user_data(data.user);

			}
		}
	})
}

function get_patron_report() {
	auth_post('/account/generate_summary_report', { user_id: user_id, account_type: user_type })
	.then((data) => {
		if (data.success) {
			if (data.data.message) {
				document.querySelector("#sales_report").innerHTML = 'No orders.';

			} else {
				let {
					best_bought_item,
					total_amount_bought_of_best_item,
					total_amount_bought,
					total_items_bought,
					orders
				} = data.data;

				populate_sales_data({ 
					total_amount_bought_of_best_item,
					best_bought_item,
					total_amount_bought,
					total_items_bought
				})

				generate_bar_graph(orders);
			}
		} 
	})
}
function populate_user_data(user) {
	for (let key in user) {
		let p = document.createElement('p');
		p.textContent = `${key.toUpperCase()}: ${user[key]}`;
		document.querySelector("#user_details").appendChild(p);
	}
}

function populate_sales_data(obj) {
	for (let key in obj) {
		let p = document.createElement('p');
		p.textContent = `${key.toUpperCase()}: ${obj[key]}`;
		document.querySelector("#sales_report").appendChild(p);
	}

}

function generate_bar_graph(orders) {
	var canvas = document.getElementById('bar_graph');
	if (canvas.getContext) {
		var ctx = canvas.getContext('2d');

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		var barWidth = 30;
		var spacing =50;
		var startX = 50;
		var startY = canvas.height - 20;

		var maxValue = Math.max(...orders.map(item => item.total_items_sold));

                ctx.font = "bold 20px Arial";
                ctx.fillStyle = 'black';
                ctx.textAlign = "center";
                ctx.fillText("Items and How Much they sell/buy", canvas.width / 2, 15);

		for (var i = 0; i < orders.length; i++) {
		    var barHeight = (orders[i].total_items_sold / maxValue) * (canvas.height - 40);
		    ctx.fillStyle = 'blue';
		    ctx.fillRect(startX, startY - barHeight, barWidth, barHeight);

		    // Draw label
			ctx.font = "10px Arial";
		    ctx.fillStyle = 'black';
		    ctx.fillText(orders[i].items, startX + barWidth / 2 - 5, startY + 10);

		    startX += barWidth + spacing;
		}
	}
}

function get_seller_report() {
	auth_post('/account/generate_summary_report', { user_id: user_id, account_type: user_type })
	.then((data) => {
		if (data.success) {
			if (data.data.message) {
				document.querySelector("#sales_report").innerHTML = 'No orders.';

			} else {

				let {
					best_sold_item,
					total_amount_sold_of_best_item,
					total_amount_sold,
					total_items_sold,
					orders
				} = data.data;

				populate_sales_data({ 
					total_amount_sold_of_best_item,
					best_sold_item,
					total_amount_sold,
					total_items_sold
				})
				
				generate_bar_graph(orders);
			}  
		}
	})
}

window.onload = () => {
    auth = get_cookie('user');
    if (auth) {
        post('/account/verify', { token: auth })
        .then((data) => {
            if (data.success) {
                if (data.user.role === 0) {
                    welcome.textContent = data.user.username;

			let params = get_query_param();
			user_id = params.get('user_id');

			get_user_data();
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


function get_overall_analytics_report() {
    const topItemsPromise = get_top_items();
    const topSellersPromise = get_top_sellers();
    const topBuyersPromise = get_top_buyers();

    Promise.all([topItemsPromise, topSellersPromise, topBuyersPromise])
        .then(([topItemsData, topSellersData, topBuyersData]) => {
            display_top_selling_items(topItemsData);
            display_top_sellers(topSellersData);
            display_top_buyers(topBuyersData);
        })
        .catch((error) => {
            console.error("Error fetching overall analytics:", error);
        });
}

function display_top_selling_items(topItems) {
    const container = document.getElementById('top-items-container');
    container.innerHTML = ''; 
    topItems.forEach(item => {
        const itemElement = document.createElement('p');
        itemElement.innerText = `Item: ${item.items}, Quantity Sold: ${item.quantity_sold}`;
        container.appendChild(itemElement);
    });
}

function display_top_sellers(topSellers) {
    const container = document.getElementById('top-sellers-container');
    container.innerHTML = ''; /
    topSellers.forEach(seller => {
        const sellerElement = document.createElement('p');
        sellerElement.innerText = `Seller ID: ${seller.seller}, Total Sales: ${seller.total_sales}`;
        container.appendChild(sellerElement);
    });
}

function display_top_buyers(topBuyers) {
    const container = document.getElementById('top-buyers-container');
    container.innerHTML = ''; 
    topBuyers.forEach(buyer => {
        const buyerElement = document.createElement('p');
        buyerElement.innerText = `Customer ID: ${buyer.customer}, Total Purchases: ${buyer.total_purchases}`;
        container.appendChild(buyerElement);
    });
}
