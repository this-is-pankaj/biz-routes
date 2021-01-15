const mongoose = require('mongoose');
const ProfileModel = require('../models/profile.model');
const collectionName = 'profiles';

const utils = require('../utils/utils');

const methods = {};

// Fetch All the profiles associated with a particular user
methods.showProfiles = (req, res) => {
  const reqId = req.reqId;
  try {
    const query = {
      _id: req.userId
    };

    ProfileModel.findOne(query)
      .then((data) => {
        console.log(data);
        utils.handleResponse(res, 200, null, data);
      })
      .catch((err) => {
        console.log(err);
        utils.handleResponse(res, 500, err, null);
      })
  }
  catch(exc) {
    console.log(`${component}.showProfiles.exception`, reqId, exc);
    utils.handleResponse(res, 500, exc, null);
  }
}

// Add a new Profile
methods.addProfile = (req, res) => {
  const reqId = req.reqId;
  try {
    const userId = req.userId;  // Use the userId to add to the req.body

    const dataToBeSaved = {
      userId,
      nick: req.body.nick,
      gstin: req.body.gstin,
      companyName: req.body.companyName,
      addresses: [{             // Save a default Address received from the GST info API
        nick: 'default',
        ...req.body.address
      }]
    }; 
    
    const profile = new ProfileModel(dataToBeSaved);

    profile.save()
      .then((data) => {
        console.log(data);
        utils.handleResponse(res, 200, null, data);
      })
      .catch((err)=>{
        utils.handleResponse(res, 500, err, null);
      })
  }
  catch(exc) {
    console.log(`${component}.showProfiles.exception`, reqId, exc);
    utils.handleResponse(res, 500, exc, null);
  }
}

module.exports = methods;