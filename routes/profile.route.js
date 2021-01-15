const express = require('express');
const profileRouter = express.Router();
const profileController = require('../controllers/profile.controller');

profileRouter.get('/', profileController.showProfiles);
profileRouter.post('/newProfile', profileController.addProfile);

module.exports = profileRouter;