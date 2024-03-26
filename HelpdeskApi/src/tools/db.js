const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(path.join(__dirname, "./munchmate.db"));
// const query = "SELECT name FROM sqlite_master WHERE type='table';";


// db.all(query, (err, tables) => {
//     if (err) {
//         console.error('Error getting table names:', err.message);
//         return;
//     }
    
//     // Loop through each table and drop it
//     tables.forEach(table => {
//         const dropQuery = `DROP TABLE ${table.name};`;
//         db.run(dropQuery, (dropErr) => {
//             if (dropErr) {
//                 console.error(`Error dropping table ${table.name}:`, dropErr.message);
//             } else {
//                 console.log(`Table ${table.name} dropped successfully.`);
//             }
//         });
//     });
// });
db.serialize(() => {
	let qs = [
	`
	CREATE TABLE IF NOT EXISTS User (
	    user_id INTEGER PRIMARY KEY,
	    username VARCHAR(50) NOT NULL,
		name VARCHAR(50) NOT NULL,
	    email VARCHAR(50) NOT NULL,
	    password VARCHAR(255),
	    status VARCHAR(50) NOT NULL,
	    role INT NOT NULL,
	    CONSTRAINT unique_username UNIQUE (username),
	    CONSTRAINT unique_email UNIQUE (email)
	);
	`,
	`	
	CREATE TABLE IF NOT EXISTS Admin (
	    admin_id INTEGER PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);
	`,
	`
	CREATE TABLE IF NOT EXISTS Seller (
	    seller_id INTEGER PRIMARY KEY,
	    user_id INT,
	    name VARCHAR(50) NOT NULL,
	    description VARCHAR(50),
	    category VARCHAR(50),
	    street_address VARCHAR(255),
	    state VARCHAR(10),
	    city VARCHAR(255),
	    zip_code VARCHAR(50),
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);
	`,
	`
	CREATE TABLE IF NOT EXISTS Helpdesk (
	    helpdesk_id INTEGER PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);
	`,
	`
	CREATE TABLE IF NOT EXISTS Patron (
	    patron_id INTEGER PRIMARY KEY,
	    user_id INT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	);
	`,
	`
	CREATE TABLE IF NOT EXISTS Flag (
	    flag_id INTEGER PRIMARY KEY,
	    comment TEXT,
	    user_id INT,
	    status VARCHAR(50),
	    acknowledged BOOLEAN,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Ticket (
	    ticket_id INTEGER PRIMARY KEY,
	    user_id INT,
	    role INT,
	    ticket_category VARCHAR(50),
	    time DATETIME DEFAULT CURRENT_TIMESTAMP,
	    status VARCHAR(10),
	    description TEXT,
	    FOREIGN KEY (user_id) REFERENCES User(user_id)
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Questions (
	    question_id INTEGER PRIMARY KEY,
	    question VARCHAR(50),
	    answer TEXT
	)
	`,
	`
	CREATE TABLE IF NOT EXISTS Orders (
	    order_id INTEGER PRIMARY KEY,
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
	    payment_id INTEGER PRIMARY KEY,
	    seller_account VARCHAR(255),
	    patron_account VARCHAR(255),
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
				console.log('Table created!');

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
