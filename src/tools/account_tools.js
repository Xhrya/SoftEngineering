const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

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
        } else {
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
