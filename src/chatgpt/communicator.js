// communicator-index.js

const API_URL = 'http://localhost:3000/api';

const instanceID = generateInstanceId();

function generateInstanceId() {
    const now = Date.now();
    let hash = 0, i, chr;
    const str = `${navigator.userAgent}${Math.random()}${now}`;
    for (i = 0; i < str.length; i++) {
        chr   = str.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
}

async function sendMessageToServer(userMessage) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userMessage, instanceID }),
        });

        if (!response.ok) {
            throw new Error(`Error from server: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Response from GPT:', data);  // Log the full response object

        // Assuming 'data.response' is a JSON string, parse it to get the actual message object
        const messageObject = JSON.parse(data.response);
        console.log('Parsed message:', messageObject);  // Log the parsed message object to ensure correct parsing

        return messageObject.message;  // Return the 'message' field from the parsed message object
    } catch (error) {
        console.error('Error sending message to server:', error);
        throw error;
    }
}

export { sendMessageToServer };
