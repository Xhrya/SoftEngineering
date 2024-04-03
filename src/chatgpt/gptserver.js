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
    const { pathname } = parse(req.url, true);

    console.log(`Request received for ${pathname}`);

    if (pathname === '/api' && req.method === 'POST') {
        let body = '';
        let size = 0;

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
                console.log('Request body received:', body);

                if (size <= MAX_PAYLOAD_SIZE) {
                    const parsedBody = JSON.parse(body);
                    const userMessage = parsedBody.userMessage;
                    console.log('User message:', userMessage);
                    conversationHistory.push({ role: "user", content: userMessage });

                    if (isMalicious(userMessage)) {
                        console.log('Malicious input detected');
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Invalid input. Please try again" }));
                        return;
                    }

                    try {
                        const completion = await openai.chat.completions.create({
                            messages: conversationHistory,
                            model: "gpt-3.5-turbo-0125",
                            response_format: { type: "json_object" },
                        });

                        const aiResponse = completion.choices[0].message.content;

                        console.log('AI response:', aiResponse);

                        // Check if AI response exceeds maximum allowed length
                        if (aiResponse.length > MAX_AI_RESPONSE_LENGTH) { // Updated length check
                            console.log('AI response exceeds maximum allowed length');
                            res.writeHead(400, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: "AI response exceeds maximum allowed length" }));
                        } else {
                            conversationHistory.push({ role: "assistant", content: aiResponse });

                            // Check if the response is still writable before sending the response
                            if (!res.writableEnded) {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.write(JSON.stringify({ response: aiResponse }), (error) => {
                                    if (error) {
                                        console.error("Error writing response:", error);
                                    }
                                    res.end();
                                });
                            }
                        }
                    } catch (error) {
                        console.error(error);
                        // Handle OpenAI API errors
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Internal server error" }));
                    }
                }
            } catch (error) {
                if (error instanceof SyntaxError) {
                    console.error("Error handling request:", error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Malformed JSON data" }));
                }
            }
        });
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

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export { decryptContent, server };