const ProfileModel = require('../models/profile.model');

module.exports.getProfilesByFilter = (filter, options) => {
  return new Promise((resolve, reject) => {
    try {
      if (!filter) {
        filter = {};
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