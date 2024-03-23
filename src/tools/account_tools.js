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
		if (type.toLowerCase() == 'patron') {
			let q = `SELECT * FROM Orders WHERE customer = ${user_id}`;
			db.query(q, (err, results) => {
				if (err) {
					reject(err);
				} else {
					if (results.length > 0) {
						let orders = [];
						let total = 0;
						for (let i = 0; i < results.length; i++) {
							orders.push(results[i]);
							total += results[i].total_price;
							if (i + 1 == results.length) {
								resolve({ success: true, total: total, orders: orders });
							}
						}
					} else {
						resolve({ success: false, message: 'No orders.' })
					}
				}
			})
		} else if (type.toLowerCase() == 'seller') {
			let q = `SELECT * FROM Orders WHERE seller = ${user_id}`;
			db.query(q, (err, results) => {
				if (err) {
					reject(err);
				} else {
					if (results.length > 0) {
						let orders = [];
						let total = 0;
						for (let i = 0; i < results.length; i++) {
							orders.push(results[i]);
							total += results[i].total_price;
							if (i + 1 == results.length) {
								resolve({ success: true, total: total, orders: orders });
							}
						}
					} else {
						resolve({ success: false, message: 'No orders.' })
					}
				}
			})

		} else {
			reject('Bad user type')
		}
	})
}
