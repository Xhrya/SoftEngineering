const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(path.join(__dirname, "./munchmate.db"));

db.serialize(() => {
	let qs = [
	`
	CREATE TABLE IF NOT EXISTS User (
	    user_id INT AUTO_INCREMENT PRIMARY KEY,
	    username VARCHAR(50) NOT NULL,
	    email VARCHAR(50) NOT NULL,
	    password VARCHAR(255) NOT NULL,
	    status VARCHAR(50) NOT NULL,
	    role INT NOT NULL,
	    CONSTRAINT unique_username UNIQUE (username),
	    CONSTRAINT unique_email UNIQUE (email)
	);
	`,
	`	
	CREATE TABLE IF NOT EXISTS Admin (
	    admin_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);
	`,
	`
	CREATE TABLE IF NOT EXISTS Seller (
	    seller_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    name VARCHAR(50) NOT NULL,
	    description VARCHAR(50),
	    category VARCHAR(50),
	    street_address VARCHAR(255),
	    state VARCHAR(10),
	    city VARCHAR(255),
	    zip_code VARCHAR(50),
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Helpdesk (
	    helpdesk_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Patron (
	    patron_id INT AUTO_INCREMENT PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Flag (
	    flag_id INT AUTO_INCREMENT PRIMARY KEY,
	    comment TEXT,
	    user_id INT,
	    status VARCHAR(50),
	    acknowledged BOOLEAN,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Ticket (
	    Ticket_id INT AUTO_INCREMENT PRIMARY KEY,
	    User_id INT,
	    Role INT,
	    Ticket_Category VARCHAR(50),
	    Time TIME,
	    STATUS VARCHAR(10),
	    Flag_status BOOLEAN,
	    Description TEXT,
	    FOREIGN KEY (User_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Orders (
	    order_id INT AUTO_INCREMENT PRIMARY KEY,
	    customer INT,
	    seller INT,
	    items TEXT,
	    status VARCHAR(50),
	    total_price FLOAT,
	    FOREIGN KEY (customer) REFERENCES User(user_id),
	    FOREIGN KEY (seller) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Payment (
	    payment_id INT AUTO_INCREMENT PRIMARY KEY,
	    seller_account VARCHAR(255),
	    patron_account VARCHAR(255),
	    FOREIGN KEY (seller_account) REFERENCES Seller(seller_id),
	    FOREIGN KEY (patron_account) REFERENCES Patron(patron_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS transactions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		payment_id INTEGER,
		transaction_id TEXT NOT NULL,
		amount REAL NOT NULL,
		currency TEXT NOT NULL,
		payment_method TEXT NOT NULL,
		status TEXT NOT NULL,
		seller_account VARCHAR(255),
		patron_account VARCHAR(255),
		FOREIGN KEY (payment_id) REFERENCES Payment(payment_id),
		FOREIGN KEY (seller_account) REFERENCES Seller(seller_id),
		FOREIGN KEY (patron_account) REFERENCES Patron(patron_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Menu_Item (
	    menu_item_id VARCHAR(50) PRIMARY KEY,
	    seller_id INT,
	    name VARCHAR(50),
	    description VARCHAR(50),
	    price FLOAT,
	    available BOOLEAN,
	    FOREIGN KEY (seller_id) REFERENCES Seller(seller_id)
	);
	`
	];
	for (let i = 0; i < qs.length; i++) {
		db.run(qs[i], (err) => {
			if (err) {
				console.log('Error', err)
			} else {
				//console.log('Table created!');

			}
		})
	}
/*
 * EXAMPLE FOR SELECTING MULTIPLE ROWS 
 *
			let q = `SELECT * FROM appointments WHERE confirmation_code = '${code}';`;
			db.all(q, (err, rows) => {
				if (err) {
					resolve({ success: false, code: 500, message: 'Issue with database, try again.' })
				}
				if (rows.length > 0) {
					resolve({ success: true, details: rows[0] })
				} else {
					resolve({ success: false, code: 400, message: 'Invalid confirmation code.' })
				}
			})
 *
 * EXAMPLE FOR INSERTING NEW ROW IN TABLE
		let q = `INSERT INTO appointments VALUES ('${c}', '${attendee}', '${dtstart}', '${dtstamp}', 'REQUEST', 'CONFIRMED');`;
		db.run(q, (err, results) => {
			if (err) {
				resolve({ success: false, message: 'Issue with database, try again.' });
			}
			resolve({ success: true, code: c })
		})
*/
})

module.exports = db;
