const path = require('path');
const mysql = require('mysql');
require('dotenv').config({ path: path.join(__dirname, "../../cred.env") });

const connection = mysql.createConnection({ 
	host: '127.0.0.1',
	user: process.env.MYSQL_USER,
	password: process.env.MYSQL_PASSWORD,
	database: 'munchmate'
})

connection.connect((err) => {
	if (err) {
		console.error('Error:' + err);
		return;
	}

	console.log('Connected to MunchMate DB!');
})

module.exports = connection;

