const crypto = require('crypto');

// Clave de encriptación y vector de inicialización (IV)
const ENCRYPTION_KEY = crypto.scryptSync(
    process.env.ENCRYPTION_KEY || 'tu_clave_secreta_predeterminada',
    'salt',
    32
);
const IV_LENGTH = 16; // Para AES-256-CBC

const encrypt = (text) => {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Error en la encriptación:', error);
        throw new Error('Error al encriptar el contenido');
    }
};

const decrypt = (text) => {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Error en la desencriptación:', error);
        throw new Error('Error al desencriptar el contenido');
    }
};

module.exports = {
    encrypt,
    decrypt
}; 