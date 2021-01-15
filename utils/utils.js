const uuidV4 = require('uuid');

/**
 * Method to generate a consistent response structure for the APIs
 *
 * @param {Object} res - The response Object
 * @param {Number} status - response status Code.
 * @param {String} err - Error message received while the transaction was being performed.
 * @param {Object} data - Custom error message that need to be returned for the API.
 */
module.exports.handleResponse = (res, status, err, data) => {
    let obj = {
        data,
        err,
        status
    };

    res.status(status).send(obj);
}

module.exports.crypto = {
    crypto: require('crypto'),
    encKey: process.env.encryptionKey || 'test',
    encrypt(text) {
        const cipher = this.crypto.createCipher('aes128', this.encKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    },
    decrypt(text) {
        const decipher = this.crypto.createDecipher('aes128', this.encKey);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

const generateUUID = ()=>{
    return uuidV4.v4();
}

module.exports.generateSessionToken = () => {
    return this.crypto.encrypt(generateUUID());
}
