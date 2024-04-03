const path = require('path');
const OpenAI = require('openai');
require('dotenv').config({ path: path.join(__dirname, "../../../env/cred.env") });

const MAX_PAYLOAD_SIZE = 10e4; 
const MAX_AI_RESPONSE_LENGTH = 10e9; 

const gpt_tools = require(path.join(__dirname, "../tools/gpt_tools.js"));

const openai = new OpenAI({ apiKey: process.env.GPT_KEY })

const training_content = gpt_tools.read_content(path.join(__dirname, "../tools/gpt_training.txt"));

//need to save conversation in cookies !!!


const router = (req, res) => {
    //AUTHENTICATE USER!
    if (req.method === 'POST') {
        let conversationHistory = [
            { role: "system", content: training_content }
        ]
        
        let body = '';
        let size = 0;
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_PAYLOAD_SIZE) {
                console.log('Payload too large');
                // Terminate request if payload is too large
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Payload too large. Please try again." }));
                req.connection.destroy(); // Close the connection to prevent further data transmission
            }
            body += chunk.toString();
        })
        req.on('end', async () => {
            try {
                if (size <= MAX_PAYLOAD_SIZE) {
                    const parsedBody = JSON.parse(body);
                    const userMessage = parsedBody.userMessage;
                    //console.log('User message:', parsedBody);
                    conversationHistory.push({ role: "user", content: userMessage });

                    if (gpt_tools.is_malicious(userMessage)) {
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

                        //console.log('AI response:', aiResponse);
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
        })
    } else {
        console.log('Invalid endpoint or method');
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: "Not found" }));
    }

    res.on('error', (error) => {
        console.error("Error writing response:", error);
    });
}

module.exports = router;

