const express = require('express');
const profileRouter = express.Router();
const profileController = require('../controllers/profile.controller');
const ewbController = require('../controllers/ewb.controller');

profileRouter.get('/', profileController.showProfiles);
profileRouter.post('/newProfile', profileController.addProfile);
profileRouter.get('/getEWBToken', ewbController.generateToken);

module.exports = profileRouter;