import http from 'http';
import { parse } from 'url';
import { config } from 'dotenv';
import crypto from 'crypto';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MAX_PAYLOAD_SIZE = 10e4;
const MAX_AI_RESPONSE_LENGTH = 10e9;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables and check for errors
const dotenvResult = config({ path: join(__dirname, "../../cred.env") });
if (dotenvResult.error) {
    console.error("Error loading .env file:", dotenvResult.error);
    process.exit(1);
}

const maliciousPatterns = [
    /SELECT.*FROM/,
    /DELETE.*FROM/,
    /UPDATE.*SET/,
    /INSERT.*INTO/,
    /UNION.*SELECT/,
    /OR '1'='1'/,
    /' OR '1'='1/
];

function isMalicious(input) {
    return maliciousPatterns.some(pattern => pattern.test(input));
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function decryptContent(encryptedContent, key, iv) {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decryptedContent = decipher.update(encryptedContent, 'hex', 'utf8');
    decryptedContent += decipher.final('utf8');
    return decryptedContent;
}

const encryptedContent = process.env.ENCRYPTED_CONTENT;
const decryptionKey = process.env.DECRYPTION_KEY;
const decryptionIV = process.env.DECRYPTION_IV;
let decryptedContent;
try {
    decryptedContent = decryptContent(encryptedContent, decryptionKey, decryptionIV);
} catch (error) {
    console.error("Error decrypting content:", error);
    process.exit(1);
}

let conversationHistory = [
    { role: "system", content: decryptedContent, }
];

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:5501'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials (cookies)


    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const { pathname } = parse(req.url, true);

    console.log(`Request received for ${pathname}`);

    if (pathname === '/api' && req.method === 'POST') {
        handleApiRequest(req, res);

 
    } else {
        console.log('Invalid endpoint or method');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not found" }));
    }

    // Error handling for response writing
    res.on('error', (error) => {
        console.error("Error writing response:", error);
    });
});

const handleApiRequest = async (req, res) => {

    let body = '';
    let size = 0;

    req.on('data', chunk => {
        size += chunk.length;
        if (size > MAX_PAYLOAD_SIZE) {
            console.log('Payload too large');
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Payload too large. Please try again." }));
            req.connection.destroy(); // Close the connection to prevent further data transmission
            return;
        }
        body += chunk.toString();
    });

    req.on('error', (error) => {
        console.error("Request error:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Internal server error" }));
    });

    req.on('end', async () => {
        try {
            const parsedBody = JSON.parse(body);
            const userMessage = parsedBody.userMessage;
            const instanceID = parsedBody.instanceID; // Store instanceID from the request

            console.log('Instance ID:', instanceID, '| User message:', userMessage);
            // console.log(); 

            if (isMalicious(userMessage)) {
                console.log('Malicious input detected');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid input. Please try again" }));
                return;
            }

            // Update the conversation history for AI processing without including instanceID
            conversationHistory.push({ role: "user", content: userMessage });

            try {
                const completion = await openai.chat.completions.create({
                    messages: conversationHistory,
                    model: "gpt-3.5-turbo-0125",
                });

                const aiResponse = completion.choices[0].message.content;

                console.log('AI response:', aiResponse);

                if (aiResponse.length > MAX_AI_RESPONSE_LENGTH) {
                    console.log('AI response exceeds maximum allowed length');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "AI response exceeds maximum allowed length" }));
                    return;
                }

                // Update conversation history with AI's response
                conversationHistory.push({ role: "assistant", content: aiResponse });

                // Return AI's response to the client
                if (!res.writableEnded) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.write(JSON.stringify({ response: aiResponse }), (error) => {
                        if (error) {
                            console.error("Error writing response:", error);
                        }
                        res.end();
                    });
                }
            } catch (error) {
                console.error("Error calling OpenAI API:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Error processing AI response" }));
            }
        } catch (error) {
            console.error("Error parsing JSON:", error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Malformed JSON data" }));
        }
    });
};



const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { decryptContent, server };