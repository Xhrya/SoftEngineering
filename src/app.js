const path = require('path');
const express = require('express');
require('dotenv').config({ path: path.join(__dirname, "../cred.env") });

const app = express();
const port = process.env.PORT;

app.get('/*', (req, res) => {
	res.send({ message: 'Welcome to MunchMate!' });
})

app.listen(port, () => {
	console.log(`API is online on port ${port}`);
})
