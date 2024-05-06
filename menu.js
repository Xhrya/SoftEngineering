


const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(path.join(__dirname, "./menu.db"));

db.serialize(() => {
    let qs = [
        `
        CREATE TABLE IF NOT EXISTS Menu_Item (
            menu_item_id INT AUTO_INCREMENT PRIMARY KEY,
            seller_id INT,
            name VARCHAR(50),
            description VARCHAR(255),
            price FLOAT,
            available BOOLEAN,
            tagArray VARCHAR(50)
        )
        `
    ];
    for (let i = 0; i < qs.length; i++) {
        db.run(qs[i], (err) => {
            if (err) {
                console.log('Error', err)
            } else {
                //console.log('Table created!');
            }
        });
    }
});

module.exports = db;
