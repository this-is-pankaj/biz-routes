const utils = require('./utils');

module.exports = (req, res, next) => {
    const tokenName = 'app-user';
    try {
        // Decrypt the userId to validate user actions with ease
        if (req.headers && req.headers[tokenName]) {
            req.userId = utils.crypto.decrypt(req.headers[tokenName]);
        }
        // Determine if the username is email or phone
        if(req.body.username) {
            req.usernameType = 'phone';
            if(req.body.username.includes('@')) {
                req.usernameType = 'email';
            }
        }
    }
    catch(exc) {
        console.log(exc);
    }
    next();
}