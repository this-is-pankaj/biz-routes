const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const collectionName = 'users';

const methods = {},
    LOG = require('../utils/logger'),
    utils = require('../utils/utils'),
    component = 'authenticate.controller';
let userCollection = mongoose.model(collectionName);
methods.login = (req, res) => {
    const reqId = req.reqId;
    try {
        let fieldsToReturn = ["_id", "name", "email", "role", "phone"];
        let query = {
            phone: req.body.login,
            password: req.body.password
        };

        userCollection.findOne(query, fieldsToReturn)
            .then(async (data) => {
                LOG.info(`${component}.login.findOne`, reqId, data);
                if (data) {
                    // Add redirection URL based on user Role.
                    let redirectionURL = await setLandingURL(data.role)
                        .catch((err) => {
                            LOG.error(`${component}.login.findOne.setLandingURL`, reqId, err)
                        });

                    data = data.toObject();  // Convert the object to a mutable one.
                    data.redirectionURL = redirectionURL;
                    data.id = utils.crypto.encrypt(data._id.toString());
                    delete data._id;
                    LOG.info(`${component}.login.findOne.setLandingURL`, reqId, data);
                    utils.handleResponse(res, 200, null, data);
                }
                else {
                    utils.handleResponse(res, 401, 'Invalid User/ Password', data);
                }
            })
            .catch((err) => {
                LOG.error(`${component}.login.findOne`, reqId, err);
                utils.handleResponse(res, 401, err, null);
            })
    }
    catch (exc) {
        LOG.error(`${component}.login`, reqId, exc);
        utils.handleResponse(res, 500, exc, null);
    }
}

methods.signup = (req, res) => {
    const reqId = req.reqId;
    try {
        let user = new UserModel(req.body);
        user.save()
            .then(async (data) => {
                LOG.info(`${component}.signup.save`, reqId, data);
                if (data) {
                    // Add redirection URL based on user Role.
                    let redirectionURL = await setLandingURL(data.role)
                        .catch((err) => {
                            LOG.error(`${component}.signup.save.setLandingURL`, reqId, err)
                        });

                    data = data.toObject();  // Convert the object to a mutable one.
                    data.redirectionURL = redirectionURL;
                    data.id = utils.crypto.encrypt(data._id.toString());
                    delete data._id;
                    delete data.password;
                    LOG.info(`${component}.signup.save.setLandingURL`, reqId, data);
                    utils.handleResponse(res, 200, null, data);
                }
                else {
                    utils.handleResponse(res, 500, 'Unable to Create user', data);
                }
            })
            .catch((err) => {
                LOG.error(`${component}.signup.save`, reqId, err);
                utils.handleResponse(res, 500, err, null);
            })
    }
    catch (exc) {
        LOG.error(`${component}.signup`, reqId, exc);
        utils.handleResponse(res, 500, err, null);
    }
}

let setLandingURL = (role) => {
    return new Promise((resolve, reject) => {
        try {
            let url = "/app/user";
            switch (role) {
                case 'superAdmin':
                    url = '/app/admin';
                    break;

                case 'admin':
                    url = '/app/admin';
                    break;

                case 'player':
                    url = '/app/user';
                    break;

                default:
                    url = '/app/user';
                    break;
            }
            resolve(url);
        }
        catch (exc) {
            reject(exc);
        }
    })
}

module.exports = methods;