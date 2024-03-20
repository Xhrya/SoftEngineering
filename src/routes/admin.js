const path = require('path');

const db = require(path.join(__dirname, "../tools/db.js"));

const router = (req, res) => {
	res.end('Hello admin!');
}

module.exports = router;
