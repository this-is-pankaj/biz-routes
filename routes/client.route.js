const express = require('express');
const clientRouter = express.Router();
const clientController = require('../controllers/client.controller');

clientRouter.get('/gstInfo', clientController);

module.exports = clientRouter; 