const crypto = require('crypto');
const querystring = require('querystring');

const encryptionKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

const encrypt = (data) => {
    const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
};

const decrypt = (data) => {
    let { encryptedData, iv } = data;
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
};

const encodeForm = (data) => {
    const encrypted = encrypt(data);
    return querystring.stringify(encrypted);
};

module.exports = {
    encrypt,
    decrypt,
    encodeForm
};
