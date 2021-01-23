const mongoose = require('mongoose');
const { getProfilesByFilter } = require('../components/profile.component');
const UserModel = require('../models/user.model');
const collectionName = 'users';
const expiry = {
    never: 31536000000, // Expiry will be one year from the date session begun
    default: 60000 * 120     // Default expiry in 1min * timeInMins
};

const methods = {},
    utils = require('../utils/utils'),
    component = 'authenticate.controller';
let userCollection = mongoose.model(collectionName);

// Method to update the session Info for a given user.
const updateUserSessions = (sessions, sessionToBeUpdated, toBeRemoved) => {
    // Return the sessions array as is if no information is provided on sessionToBeUpdated
    if(!sessionToBeUpdated) {
        return sessions || [];
    }

    // If a new session is to be added,
    if(!toBeRemoved) {
        sessions.push(sessionToBeUpdated);
        return sessions;
    }

    // If toBeRemoved is true, delete the session from the list of sessions
    sessions = sessions.filter((s) => {
        return s.token !== sessionToBeUpdated;
    });

    return sessions;
}

methods.isLoggedIn = (req, res) => {
    const reqId = req.reqId;
    try {
        const query = {
            _id: req.userId
        }
        userCollection.findOne(query)
            .then((data) => {
                if (!data || !data._id) {
                    utils.handleResponse(res, 204, exc, { isLoggedIn: false });
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
                const { sessions } = user;
                const incomingSession = {
                    token: req.headers['app-session-id'],
                    agent: req.headers['user-agent']
                }

                const existingSession = sessions.filter((session) => {
                    if (session.token === incomingSession.token) {
                        return session;
                    }
                });

                // If session doesn't exist, return isloggedIn as false
                if (existingSession && existingSession.length && user.isActive) {
                    const startTime = new Date(existingSession[0].startTime).valueOf();    //Convert start time to ms
                    if (existingSession.rememberSession) {
                        utils.handleResponse(res, 200, '', { isLoggedIn: (Date.now() - startTime < expiry.never), user: resObj });
                    }
                    else {
                        utils.handleResponse(res, 200, '', { isLoggedIn: (Date.now() - startTime < expiry.default), user: resObj });
                    }
                }
                else {
                    utils.handleResponse(res, 204, exc, { isLoggedIn: false, user: resObj });
                }
            })
    }
    catch (exc) {
        console.log(`${component}.isLoggedIn.exception`, reqId, exc);
        utils.handleResponse(res, 500, exc, { isLoggedIn: false, user: null });
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
            .then(async (data) => {
                if (data) {
                    const user = data.toObject();  // Convert the object to a mutable one.
                    // Check if the headers have an expired sessionID. If so, remove it from the sessions list so that a new session may be added.
                    const incomingSession = {
                        token: req.headers['app-session-id'],
                        agent: req.headers['user-agent']
                    };

                    if(incomingSession.token) {
                        data.sessions = updateUserSessions(data.sessions, incomingSession.token, true);
                        console.log(`Updated user sessions length ${user.sessions.length}`)
                    }
                    // Check if the user has 3 sessions or more. If so, reject the login attempt and stop the code flow.
                    if (data.sessions && data.sessions.length >= 3) {
                        console.log(`${component}.login.activeSessions`, reqId, user.sessions.length);
                        return utils.handleResponse(res, 403, 'You already have 3 active sessions. Please logout from other devices.', null);
                    }
                        
                    user.id = utils.crypto.encrypt(user._id.toString());
                    delete user._id;
                    // Generate session ID for the user so that he may be logged in
                    const sessionToken = utils.generateSessionToken();
                    res.set({
                        'App-session-id': sessionToken,
                        'App-user-id': user.id,
                        'App-token-expiry': Date.now() + expiry.default
                    });
                    delete user.sessions;

                    const fieldsToReturn = ["_id", "nick", "companyName", "gstin", "addresses"];
                    const q = {
                        userId: utils.crypto.decrypt(user.id)
                    };
                    const profileRes = await getProfilesByFilter(q, fieldsToReturn)
                        .catch((err) => {
                            console.log(`${component}.getProfiles.error`, reqId, err);
                            // Return blank array by default
                            return [];
                        });

                    user.profiles = profileRes || [];
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

methods.logout = (req, res) => {
    const reqId = req.reqId;
    try {
        const query = {
            _id: req.userId
        };

        const incomingSession = {
            token: req.headers['app-session-id'],
            agent: req.headers['user-agent']
        }

        // If no session is provided in the API reject with 400 validation error
        if(!incomingSession.token) {
            return utils.handleResponse(res, 400, 'No active session to log you out from.', null);
        }
        // Else continue with the flow
        userCollection.findOne(query)
            .then((data) => {
                if (!data || !data._id) {
                    return utils.handleResponse(res, 204, exc, { isLoggedIn: false });
                }
                const user = data.toObject();
                // user.id = utils.crypto.encrypt(user._id.toString());
                // delete user._id;

                // const { sessions } = user;

                // Remove the matching session from existing sessions array.

                data.sessions = updateUserSessions(data.sessions, incomingSession.token, true);

                data.save()
                    .then((doc) => {
                        console.log('User logged out');
                        utils.handleResponse(res, 200, '', { isLoggedIn: false});
                    })
                    .catch((err) => {
                        console.log('User not logged out error');
                        utils.handleResponse(res, 500, 'Error when logging out', { isLoggedIn: false});
                    })
            })
    }
    catch(exc) {

    }
}

module.exports = methods;