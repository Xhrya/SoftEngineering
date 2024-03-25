// communicatortest.js
import fetch from 'node-fetch';
import readline from 'readline';

const API_URL = 'http://localhost:3000/api';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function sendMessageToServer(userMessage) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userMessage }),
        });

        if (!response.ok) {
            throw new Error(`Error from server: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response from server:', data.response);

        // Prompt user for next message
        promptUser();
    } catch (error) {
        console.error('Error sending message to server:', error);
    }
}

function promptUser() {
    rl.question('Your message: ', (userMessage) => {
        if (userMessage.toLowerCase() === 'exit') {
            console.log('Exiting...');
            rl.close();
            return;
        }
        sendMessageToServer(userMessage);
    });
}

// Initiate conversation
promptUser();

export { sendMessageToServer };
