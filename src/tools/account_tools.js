const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const db = require(path.join(__dirname, "./db.js"));

module.exports.verify = (token) => {
	return new Promise((resolve, reject) => {
		try {
			let decoded = jwt.verify(token, process.env.JWT_SECRET);
			resolve(decoded);
		} catch(error) {
			reject(error);
		}
	})
}


module.exports.generate_sales_report = (user_id, type) => {
    return new Promise((resolve, reject) => {
        let q;
        if (type.toLowerCase() == 'patron') {
            q = `
                SELECT 
                    items, 
                    SUM(total_price) AS total_amount_bought, 
                    COUNT(*) AS total_items_bought 
                FROM Orders 
                WHERE customer = ${user_id} 
                GROUP BY items 
                ORDER BY total_amount_bought DESC
            `;
        } else if (type.toLowerCase() == 'seller') {
            q = `
                SELECT 
                    items, 
                    SUM(total_price) AS total_amount_sold, 
                    COUNT(*) AS total_items_sold 
                FROM Orders 
                WHERE seller = ${user_id} 
                GROUP BY items 
                ORDER BY total_amount_sold DESC
            `;
        } 
        else if( type.toLowerCase() == 'admin' || type.toLowerCase() == 'helpdesk')
        {
            q = `
                SELECT 
                    items, 
                    customer, 
                    seller, 
                FROM Orders 
                GROUP BY items 
                ORDER BY total_amount_sold DESC
            `;

        }else {
            reject('Bad user type');
            return;
        }

        db.query(q, (err, results) => {
            if (err) {
                reject(err);
            } else {
                if (results.length > 0) {
                    if (type.toLowerCase() == 'patron') {
                        const bestBoughtItem = results[0].items;
                        const totalAmountBoughtOfBestItem = results[0].total_amount_bought;
                        const totalAmountBought = results.reduce((acc, curr) => acc + curr.total_amount_bought, 0);
                        const totalItemsBought = results.reduce((acc, curr) => acc + curr.total_items_bought, 0);

                        resolve({
                            success: true,
                            best_bought_item: bestBoughtItem,
                            total_amount_bought_of_best_item: totalAmountBoughtOfBestItem,
                            total_amount_bought: totalAmountBought,
                            total_items_bought: totalItemsBought,
                            orders: results
                        });
                    } else if (type.toLowerCase() == 'seller') {
                        const bestSoldItem = results[0].items;
                        const totalAmountSoldOfBestItem = results[0].total_amount_sold;
                        const totalAmountSold = results.reduce((acc, curr) => acc + curr.total_amount_sold, 0);
                        const totalItemsSold = results.reduce((acc, curr) => acc + curr.total_items_sold, 0);

                        resolve({
                            success: true,
                            best_sold_item: bestSoldItem,
                            total_amount_sold_of_best_item: totalAmountSoldOfBestItem,
                            total_amount_sold: totalAmountSold,
                            total_items_sold: totalItemsSold,
                            orders: results
                        });
                    }
                } else {
                    resolve({ success: false, message: 'No orders.' });
                }
            }
        });
    });
};

module.exports.generate_monthly_sales_report = (user_id, type) => {
    return new Promise((resolve, reject) => {
        let q;
        if (type.toLowerCase() == 'patron') {
            q = `
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    COUNT(*) AS total_items_sold
                FROM Orders 
                WHERE customer = ${user_id} 
                GROUP BY month
                ORDER BY month ASC
            `;
        } else if (type.toLowerCase() == 'seller') {
            q = `
                SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') AS month,
                    COUNT(*) AS total_items_sold
                FROM Orders 
                WHERE seller = ${user_id} 
                GROUP BY month
                ORDER BY month ASC
            `;
        } else {
            reject('Bad user type');
            return;
        }

        db.query(q, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

function get_top_items() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT items, COUNT(*) AS quantity_sold 
            FROM Orders 
            GROUP BY items 
            ORDER BY quantity_sold DESC 
            LIMIT 5;
        `;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function get_top_sellers() {
    return new Promise((resolve, reject) => {
      
        const query = `
            SELECT seller, COUNT(*) AS total_sales 
            FROM Orders 
            GROUP BY seller 
            ORDER BY total_sales DESC 
            LIMIT 5;
        `;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function get_top_buyers() {
    return new Promise((resolve, reject) => {
       
        const query = `
            SELECT customer, COUNT(*) AS total_purchases 
            FROM Orders 
            GROUP BY customer 
            ORDER BY total_purchases DESC 
            LIMIT 5;
        `;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports.get_top_items = get_top_items;
module.exports.get_top_sellers = get_top_sellers;
module.exports.get_top_buyers = get_top_buyers;
