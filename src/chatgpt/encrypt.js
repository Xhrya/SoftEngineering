// the point of this file is to securely define the parameters of the AI key and encryption. 

import crypto from 'crypto';
import fs from 'fs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables and check for errors
const dotenvResult = config({ path: join(__dirname, "../../cred.env") });

if (dotenvResult.error) {
    console.error("Error loading .env file:", dotenvResult.error);
    process.exit(1);
}

function generateKeyAndIV() {
    return {
        key: crypto.randomBytes(32), // Generates a 32-byte key
        iv: crypto.randomBytes(16)   // Generates a 16-byte iv
    };
}

function encryptContent(content, keyBuffer, ivBuffer) {
    // Creating cipheriv with its parameters
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    
    let encryptedContent = cipher.update(content, 'utf8', 'hex');
    encryptedContent += cipher.final('hex');
    
    return encryptedContent;
}

function readContentFromFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error("Error reading file:", error);
        process.exit(1);
    }
}

// Generate a one-time key and IV for this encryption session
const { key, iv } = generateKeyAndIV();

const filePath = 'content.txt'; // Path to your file
const myContent = readContentFromFile(filePath);
const encryptedContent = encryptContent(myContent, key, iv);

console.log("One-Time Encryption Key:", key.toString('hex'));
console.log("One-Time Encryption IV:", iv.toString('hex'));
console.log("Encrypted Content:", encryptedContent);
