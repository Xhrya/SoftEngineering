const path = require('path');
const db = require(path.join(__dirname, "./db.js"));

let q = `
INSERT INTO User (user_id, username, email, password, status, role) VALUES 
		(default, 'John Doe', 'johndoe@yahoo.com', 'secure_password', 'active', 1),
		(default, 'Omar Hamoudeh', 'omarHam@gmail.com', 'unsecure_password', 'ban', 1),
		(default, 'Ivan Marsic', 'ivanMarsic@aol.com', 'verysecure_password', 'ban', 1),
		(default, 'Jane Doe', 'janedoe@hotmail.com', 'password123', 'active', 1),
		(default, 'Chef Alex', 'alexCooks@gmail.com', 'mypassword', 'active', 1),
		(default, 'Foodie Sam', 'samTastes@rutgers.edu', 'testpassword', 'active', 1);
`
db.query(q, (err, results) => {
    if (err) throw err;
    console.log('done');
})