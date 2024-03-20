import http from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import crypto from 'crypto';
import OpenAI from 'openai';

// Load environment variables
const result = dotenv.config({ path: "cred.env" });

if (result.error) {
    console.error("Error loading .env file:", result.error);
    process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function decryptContent(encryptedContent, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decryptedContent = decipher.update(encryptedContent, 'hex', 'utf8');
    decryptedContent += decipher.final('utf8');
    return decryptedContent;
}

// Decrypt content initially as it won't change
const encryptedContent = process.env.ENCRYPTED_CONTENT;
const decryptionKey = process.env.DECRYPTION_KEY;
let decryptedContent;
try {
    decryptedContent = decryptContent(encryptedContent, decryptionKey);
} catch (error) {
    console.error("Error decrypting content:", error);
    process.exit(1);
}

const server = http.createServer(async (req, res) => {
    const { pathname } = parse(req.url, true);

    if (pathname === '/api' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const userMessage = JSON.parse(body).userMessage;

                const completion = await openai.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: decryptedContent,
                        },
                        { role: "user", content: userMessage },
                    ],
                    model: "gpt-3.5-turbo-0125",
                    response_format: { type: "json_object" },
                });

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response: completion.choices[0].message.content }));
            } catch (error) {
                console.error("Error handling request:", error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Internal server error" }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not found" }));
    }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
