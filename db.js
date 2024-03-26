const path = require('path');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(path.join(__dirname, "./order.db"));

db.serialize(() => {
    let qs = [
        `
        CREATE TABLE IF NOT EXISTS Orders (
            order_id INTEGER PRIMARY KEY,
            customer INT,
            seller INT,
            items TEXT,
            status VARCHAR(50),
            total_price FLOAT
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
