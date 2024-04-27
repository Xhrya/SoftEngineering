import { config } from 'dotenv';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const MAX_PAYLOAD_SIZE = 10e4;
const MAX_AI_RESPONSE_LENGTH = 10e9;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables and check for errors
const dotenvResult = config({ path: join(__dirname, "../../cred.env") });


function decryptContent(encryptedContent, key, iv) {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decryptedContent = decipher.update(encryptedContent, 'hex', 'utf8');
    decryptedContent += decipher.final('utf8');
    console.log(decryptedContent)
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
