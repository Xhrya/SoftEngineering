// communicator.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

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
        console.log('Response from GPT:', data.response);
    } catch (error) {
        console.error('Error sending message to server:', error);
    }
}

// Example usage
sendMessageToServer('What should I eat today?');
