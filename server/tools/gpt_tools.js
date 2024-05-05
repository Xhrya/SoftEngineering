const fs = require('fs');
const crypto = require('crypto');

const maliciousPatterns = [
    /SELECT.*FROM/,
    /DELETE.*FROM/,
    /UPDATE.*SET/,
    /INSERT.*INTO/,
    /UNION.*SELECT/,
    /OR '1'='1'/,
    /' OR '1'='1/
];

const decrypt = (encrypted, key, iv) => {
    const keyBuffer = Buffer.from(key, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    let decryptedContent = decipher.update(encrypted, 'hex', 'utf8');
    decryptedContent += decipher.final('utf8');
    return decryptedContent;
}

const generate_key_iv = () => {
    return { 
        key: crypto.randomBytes(32),
        iv: crypto.randomBytes(16)
    }
}

const encrypt = (content, keyBuffer, ivBuffer) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, ivBuffer);
    
    let encryptedContent = cipher.update(content, 'utf8', 'hex');
    encryptedContent += cipher.final('hex');
    
    return encryptedContent;
}

const read_content = (file_path) => {
    try {
        return fs.readFileSync(file_path, 'utf8');
    } catch(error) {
        console.error("Error reading file:", error);
        process.exit(1);
    }
}

const is_malicious = (input) => {
    return maliciousPatterns.some(pattern => pattern.test(input));
}

module.exports = {
    decrypt: decrypt,
    read_content: read_content,
    encrypt: encrypt,
    generate_key_iv: generate_key_iv,
    is_malicious: is_malicious
}