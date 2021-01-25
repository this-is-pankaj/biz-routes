const axios = require('axios');
const config = require(`../config/${process.env.Node_ENV || 'local'}`);
const profileMethod = require('../components/profile.component');

const methods = {};
const tokenExpiry = 6 * 60 * 60 * 1000; // 6hrs token expiry

// Fetch token from the API and authenticate the user's credential for use
const getTokenFromAPI = async (profile) => {
  try {
    // Generate the token using the API
    const headers = config.ewbConfig.generateToken.headers;
    // Update the user info header
    headers.gstin = profile.gstin;
    headers.ewbpwd = profile.credentials.ewb.password;
    headers.username = profile.credentials.ewb.username;

    const info = await axios({
      method: 'GET',
      url: config.ewbConfig.generateToken.url,
      headers
    })
      .catch((err) => {
        console.log(`EWBToken.getTokenFromAPI.error ${err}`);
        throw { success: false, msg: err };
      });

    // For successful response, status ="1", and for error status_cd="0".
    if (parseInt(info.data.status_cd) || parseInt(info.data.status)) {
      return {success: true, data: info.data.authtoken};
    }

    throw { success: false, msg: 'Unable to process request' };
  }
  catch (exc) {
    console.log(`EWBToken.getTokenFromAPI.exception ${exc}`);
    throw {success: false, msg: exc};
  }
};

// Method to save a token and expiry to the profile and in turn the DB
const saveTokenToProfile = async (token, profile) => {
  try {
    profile.credentials.ewb.token = token;
    profile.credentials.ewb.expiry = Date.now()+tokenExpiry;

    const updateProfile = await profileMethod.updateProfile(profile._id, profile)
      .catch((err) => {
        throw {success: false, msg: err};
      })

    return {success: true, data: updateProfile};
  }
  catch(exc) {
    throw {success: false, msg: exc};
  }
}

methods.getToken = async (profileId) => {
  try {
    const q = {
      _id: profileId,
      isActive: true
    };

    let profile = await profileMethod.getProfilesByFilter(q)
      .catch((err) => {
        throw {success: false, msg: err};
      });

    profile = profile[0];
    
    if (profile) {
      if (profile.credentials && profile.credentials.ewb && profile.credentials.ewb.expiry) {
        const expiry = new Date(profile.credentials.ewb.expiry);
        // If the expiry is within 6hrs, reuse the same token instead of generating a new one.
        if ((expiry - Date.now()) > 0) {
          return {success: true, data: profile.credentials.ewb.token};
        }
      }
      // Get the token from API for the given profile
      const token = await getTokenFromAPI(profile)
        .catch((err) => {
          throw {success: false, msg: err};
        });

      if(token) {
        // Save the token to the profile in the DB for reuse.
        saveTokenToProfile(token, profile);
        return {success: true, data: token};
      }
    }
    throw {success: false, msg: 'Unable to generate Token'};
  }
  catch (exc) {
    console.log(exc);
    throw {success: false, msg: 'Unable to fetch token.'};
  }
}

methods.setToken = async (profileId) => {
  try {
    const q = {
      _id: profileId,
      isActive: true
    };
    const profile = await profileMethod.getProfilesByFilter(q)
      .catch((err) => {
        throw {success: false, msg: err};
      })

    profile
  }
  catch (exc) {
    console.log(exc);
    throw {success: false, msg: 'Unable to set token.'};
  }
}

module.exports = methods;