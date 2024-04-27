// app.js

import { sendMessageToServer } from "./chatgpt/communicator-index.js";

document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendUserMessage();
    }
});

document.querySelector('.send-button').addEventListener('click', sendUserMessage);

export async function sendUserMessage() {
    const inputField = document.getElementById('user-input');
    const message = inputField.value.trim();
    if (message) {
        appendMessage('You', message);
        inputField.value = '';
        try {
            const messageText = await sendMessageToServer(message);
            appendMessage('Bot', messageText);
        } catch (error) {
            console.error('Error:', error);
            appendMessage('Bot', 'Sorry, I encountered an error. Please try again.');
        }
    }
}

function appendMessage(sender, message) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.textContent = `${sender}: ${message}`;
    messageDiv.classList.add(sender === 'You' ? 'user-message' : 'bot-message');
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the bottom
}
