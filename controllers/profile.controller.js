const { getProfilesByFilter } = require('../components/profile.component');
const ProfileModel = require('../models/profile.model');
const collectionName = 'profiles';
const component = 'profileController';

const utils = require('../utils/utils');

const methods = {};

// Fetch All the profiles associated with a particular user
methods.showProfiles = async (req, res) => {
  const reqId = req.reqId;
  try {
    if(!req.userId) {
      return utils.handleResponse(res, 400, 'Invalid user', null);
    }
    const fieldsToReturn = ["_id", "nick", "companyName", "gstin", "addresses"];
    const q = {
      userId: req.userId,
      isActive: true
    };

    const profileRes = await getProfilesByFilter(q, fieldsToReturn)
      .catch((err) => {
        console.log(`${component}.showProfiles.error`, reqId, err);
        utils.handleResponse(res, 500, err, null);
      });

    if(profileRes) {
      if(!profileRes.length) {
        utils.handleResponse(res, 204, null, profileRes);
      }
      else {
        // Encrypt the outgoing profile IDs
        utils.handleResponse(res, 200, null, profileRes);
      }
    }
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
      credentials: req.body.credentials,
      addresses: [{             // Save a default Address received from the GST info API
        nick: 'default',
        ...req.body.address
      }]
    }; 
    
    const profile = new ProfileModel(dataToBeSaved);

    profile.save()
      .then(async (data) => {
        console.log(data);
        const fieldsToReturn = ["_id", "nick", "companyName", "gstin", "addresses"];
        const q = {
          userId,
          isActive: true
        };

        const profileRes = await getProfilesByFilter(q, fieldsToReturn)
          .catch((err) => {
            console.log(`${component}.showProfiles.error`, reqId, err);
            utils.handleResponse(res, 500, err, null);
          });
        utils.handleResponse(res, 200, null, profileRes);
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