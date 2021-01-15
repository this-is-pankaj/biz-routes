const authenticationRouter = require("./auth.route");
const profileRouter = require("./profile.route");

module.exports = {
    authRouter: authenticationRouter,
    profileRouter: profileRouter
}