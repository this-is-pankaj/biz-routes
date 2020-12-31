const utils = require('./utils');

module.exports = (req, res, next) => {
    if (req.headers && req.headers.f3q) {
        req.userId = utils.crypto.decrypt(req.headers.f3q);
    }
    next();
}