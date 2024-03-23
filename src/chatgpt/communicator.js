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
        return data.response; // Return the response for potential future use
    } catch (error) {
        console.error('Error sending message to server:', error);
        throw error; // Re-throw the error for potential error handling outside of this function
    }
}

export { sendMessageToServer, handleServerResponse };
