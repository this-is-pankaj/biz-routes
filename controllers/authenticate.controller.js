const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const collectionName = 'users';
const expiry = {
    never: 31536000000, // Expiry will be one year from the date session begun
    default: 21600000
};

const methods = {},
    utils = require('../utils/utils'),
    component = 'authenticate.controller';
let userCollection = mongoose.model(collectionName);

methods.isLoggedIn = (req, res) => {
    const reqId = req.reqId;
    try {
        const query = {
            _id: req.userId
        }
        userCollection.findOne(query)
            .then((data) => {
                if(!data || !data._id) {         
                    utils.handleResponse(res, 204, exc, {isLoggedIn: false});
                }
                const user = data.toObject();
                user.id = utils.crypto.encrypt(user._id.toString());
                delete user._id;

                const resObj = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    phone: user.phone
                }
                const {sessions} = user;
                const incomingSession = {
                    token: req.headers['app-session-id'],
                    agent: req.headers['user-agent']
                }

                const existingSession = sessions.filter((session)=>{
                    if(session.token === incomingSession.token) {
                        return session;
                    }
                });

                // If session doesn't exist, return isloggedIn as false
                if(existingSession && existingSession.length && user.isActive) {
                    const startTime = new Date(existingSession[0].startTime).valueOf();    //Convert start time to ms
                    if(existingSession.rememberSession) {
                        utils.handleResponse(res, 200, '', {isLoggedIn: (Date.now() - startTime < expiry.never), user: resObj});
                    }
                    else {
                        utils.handleResponse(res, 200, '', {isLoggedIn: (Date.now() - startTime < expiry.default), user: resObj});
                    }
                }
                else {                    
                    utils.handleResponse(res, 204, exc, {isLoggedIn: false, user: resObj});
                }
            })
    }
    catch(exc) {
        console.log(`${component}.isLoggedIn.exception`, reqId, exc);
        utils.handleResponse(res, 500, exc, {isLoggedIn: false, user: null});
    }
};

methods.login = (req, res) => {
    const reqId = req.reqId;
    try {
        let fieldsToReturn = ["_id", "name", "email", "userType", "phone", "sessions"];
        let query = {
            [req.usernameType]: req.body.username,
            isActive: true,     // Only look for active users
            password: utils.crypto.encrypt(req.body.password)       // Encrypt the incoming password
        };
        
        userCollection.findOne(query, fieldsToReturn)
            .then((data) => {
                if (data) {
                    const user = data.toObject();  // Convert the object to a mutable one.
                    user.id = utils.crypto.encrypt(user._id.toString());
                    delete user._id;
                    // Generate session ID for the user so that he may be logged in
                    const sessionToken = utils.generateSessionToken();
                    res.set({
                        'App-session-id': sessionToken,
                        'App-user-id': user.id,
                        'App-token-expiry': Date.now()+expiry.default
                    });
                    delete user.sessions;
                    utils.handleResponse(res, 200, null, user);
                    // Push the session information to the user's active sessions array
                    data.sessions.push({
                        token: sessionToken,
                        rememberSession: !!req.body.rememberMe,
                        agent: req.headers['user-agent']
                    });
                    // Save the updated doc for the user
                    data.save();
                }
                else {
                    utils.handleResponse(res, 401, 'Invalid User/ Password', data);
                }
            })
            .catch((err) => {
                console.log(`${component}.login.findOne`, reqId, err);
                utils.handleResponse(res, 401, err, null);
            })
    }
    catch (exc) {
        console.log(`${component}.login`, reqId, exc);
        utils.handleResponse(res, 500, exc, null);
    }
}

methods.signup = (req, res) => {
    const reqId = req.reqId;
    console.log("Signing the user up");
    try {
        // Encrypt the password before saving.
        if (req.body && req.body.password) {
            req.body.password = utils.crypto.encrypt(req.body.password);
        }
        let user = new UserModel(req.body);
        user.save()
            .then(async (data) => {
                // console.log(`${component}.signup.save`, reqId, data);
                if (data) {
                    data = data.toObject();  // Convert the object to a mutable one.
                    delete data._id;
                    delete data.password;
                    
                    utils.handleResponse(res, 200, null, data);
                }
                else {
                    utils.handleResponse(res, 500, 'Unable to Create user', data);
                }
            })
            .catch((err) => {
                console.log(`${component}.signup.save`, reqId, err);
                utils.handleResponse(res, 500, err, null);
            })
    }
    catch (exc) {
        console.log(`${component}.signup`, reqId, exc);
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