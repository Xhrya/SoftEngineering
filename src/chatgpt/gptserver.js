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

if (dotenvResult.error) {
    console.error("Error loading .env file:", dotenvResult.error);
    process.exit(1);
}



const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function decryptContent(encryptedContent, key, iv) {
    // Ensure key and IV are both Buffers
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');

    // Creating Decipheriv with its parameters
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

// Initialize an empty conversation history
let conversationHistory = [
    {
        role: "system",
        content: decryptedContent,
    }
];

const server = http.createServer(async (req, res) => {
    const { pathname } = parse(req.url, true);

    if (pathname === '/api' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_PAYLOAD_SIZE) {
                console.log('Payload too large');
                // Terminate request if payload is too large
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Payload too large. Please try again." }));
                req.connection.destroy(); // Close the connection to prevent further data transmission
            }
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const parsedBody = JSON.parse(body); // Attempt to parse JSON
                const userMessage = parsedBody.userMessage;

                // const userMessage = JSON.parse(body).userMessage;
                // Add user's message to conversation history
                conversationHistory.push({ role: "user", content: userMessage });

                const completion = await openai.chat.completions.create({
                    messages: conversationHistory,
                    model: "gpt-3.5-turbo-0125",
                    response_format: { type: "json_object" },
                });

                // Add AI's response to conversation history
                const aiResponse = completion.choices[0].message.content;
                conversationHistory.push({ role: "assistant", content: aiResponse });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: aiResponse }));
                    if (isMalicious(userMessage)) {
                        console.log('Malicious input detected');
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Invalid input. Please try again" }));
                        return;
                    }

            } catch (error) {
                if (error instanceof SyntaxError) { // Catch JSON parsing errors
                    console.error("Error handling request:", error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Malformed JSON data" }));
                    return;
                }
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not found" }));
    }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { decryptContent, server }