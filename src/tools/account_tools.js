const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

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
