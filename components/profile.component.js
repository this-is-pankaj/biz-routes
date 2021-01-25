const ProfileModel = require('../models/profile.model');

module.exports.getProfilesByFilter = (filter, options) => {
  return new Promise((resolve, reject) => {
    try {
      if (!filter) {
        filter = {};
      }

      if (!options) {
        options = {};
      }

      ProfileModel.find(filter, options, (err, docs) => {
        if(err) {
          reject(err);
        }
        else {
          resolve(docs);
        }
      })
    }
    catch (exc) {
      reject(exc);
    }
  })
}

module.exports.updateProfile = (profileId, updatedProfile, options) => {
  return new Promise((resolve, reject) => {
    try {
      if (!profileId) {
        reject('No profile to save');
      }

      if(!options) {
        options = {};
      }

      const filter = {
        _id: profileId
      };

      ProfileModel.findOneAndUpdate(filter, updatedProfile ,options, (err, docs) => {
        if(err) {
          reject(err);
        }
        else {
          resolve(docs);
        }
      })
    }
    catch(exc) {
      reject(exc);
    }
  })
}