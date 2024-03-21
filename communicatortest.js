// communicator.js
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function sendMessageToServer(userMessage, followUp = false) {
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

        // Decide on the next step based on the response
        if (!followUp) {
            handleServerResponse(data.response);
        }
    } catch (error) {
        console.error('Error sending message to server:', error);
    }
}

function handleServerResponse(response) {
    // Check the response for certain keywords and respond accordingly
    if (/cuisine/i.test(response) && /Chinese|Italian|Pizza/i.test(response)) {
        console.log('Responding to cuisine question...');
        sendMessageToServer('Italian sounds great!', true); // Example follow-up response
    } 
    // else if (/Tiramisu/i.test(response)) {
    //     console.log('Responding to list of cuisine options...');
    //     sendMessageToServer('Which one would you recommend?', true); // Another example follow-up response
    // }
    // Add more conditions here as needed to handle different types of responses
}

// Example usage
sendMessageToServer('What should I eat today?');

export { sendMessageToServer, handleServerResponse };