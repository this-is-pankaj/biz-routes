const axios = require('axios');
const config = require(`../config/${process.env.Node_ENV || 'local'}`);
const profileMethod = require('../components/profile.component');

const methods = {};
const tokenExpiry = 6 * 60 * 60 * 1000; // 6hrs token expiry

// Fetch token from the API and authenticate the user's credential for use
const getTokenFromAPI = async (profile) => {
  try {
    console.log(profile);
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
      return { success: true, data: info.data.authtoken };
    }

    throw { success: false, msg: 'Unable to process request' };
  }
  catch (exc) {
    console.log(`EWBToken.getTokenFromAPI.exception ${exc}`);
    throw { success: false, msg: exc };
  }
};

// Method to save a token and expiry, docs to the profile and in turn the DB
const updateProfile = async (profile) => {
  try {
    const updatedProfile = await profileMethod.updateProfile(profile._id, profile)
      .catch((err) => {
        throw { success: false, msg: err };
      });

    console.log('Profile after saving ', updatedProfile);
    return { success: true, data: updatedProfile };
  }
  catch (exc) {
    throw { success: false, msg: exc };
  }
}

const getFilteredProfile = async (filter) => {
  try {
    let profile = await profileMethod.getProfilesByFilter(filter)
      .catch((err) => {
        throw { success: false, msg: err };
      });

    if (!profile) {
      throw { success: false, msg: 'Profile Not found' };
    }

    return { success: true, data: profile[0] };
  }
  catch (exc) {
    throw { success: false, msg: exc };
  }
}

methods.getToken = async (profileId, userId) => {
  try {
    const q = {
      _id: profileId,
      userId,
      isActive: true
    };
    // Fetch the profile from the given userId and ProfileId
    let profile = await getFilteredProfile(q)
      .catch((err) => {
        throw { success: false, msg: err };
      })

    console.log(`GetToken.getFilteredProfile.response ${profile.success}: ${JSON.stringify(profile)}`);
    if (profile.success) {
      profile = profile.data;
      // If credentials be associated with the profile, proceed
      if (profile.credentials && profile.credentials.ewb) {
        let token = '';

        if(profile.credentials.ewb.expiry && profile.credentials.ewb.token) {
          const expiry = new Date(profile.credentials.ewb.expiry);
          token = profile.credentials.ewb.token;
          // If the token has not expired yet, return the token for further processing.
          if ((expiry - Date.now()) > 0) {
            return {success: true, data: {token, profile}};
          }
          // If it has expired, continue with the following section outside the code block.
        }
        // If the token has expired or was never generated, fetch it from the API
        // Get the token from API for the given profile
        token = await getTokenFromAPI(profile)
          .catch((err) => {
            throw { success: false, msg: err };
          });

        console.log(`GetToken.getTokenFromAPI.response : ${JSON.stringify(token)}`);
        if (token.success) {
          token = token.data;
          profile.credentials.ewb.token = token;
          profile.credentials.ewb.expiry = Date.now() + tokenExpiry;
          // Save the token to the profile in the DB for reuse.
          let updatedProfile = await updateProfile(profile)
            .catch((err) => {
              return { success: true, data: { token }, msg: 'Unable to update profile' };
            });

          console.log(`GetToken.updateProfile.response : ${JSON.stringify(updatedProfile)}`);
          if (updatedProfile.success) {
            updatedProfile = updatedProfile.data;
            return { success: true, data: { token, profile: updatedProfile } };
          }
          return { success: true, data: { token }, msg: 'Unable to update profile' };
        }

        throw {success: false, msg: 'Profile was found, but failed to generate token.'};
      }
      // Else throw error for creds non availability.
      throw {success: false, msg: 'No associated EWB credentials fot the profile.'}
    }

    throw { success: false, msg: 'Unable to generate Token' };
  }
  catch (exc) {
    console.log(`GetToken.exception : ${exc}`);
    throw { success: false, msg: 'Unable to fetch token.' };
  }
}

const generateEWB = async (ewbData, token, profile, shouldUpdateProfileWithResponse) => {
  try {
    const headers = config.ewbConfig.generateEWB.headers;
    const res = await axios({
      method: 'POST',
      url: config.ewbConfig.generateEWB.url,
      data: ewbData,
      params: {
        authtoken: token,
        gstin: profile.gstin,
        username: profile.credentials.ewb.username
      },
      headers
    })
      .catch((err) => {
        throw { success: false, msg: err.response.data.error.message };
      });
      
    if (res.status === 200) {
      const ewbDetails = res.data;

      if (shouldUpdateProfileWithResponse) {
        // If set to true update the profile with relevant values
        const valueToBeSaved = {
          ...ewbDetails,
          createdOn: new Date()
        }
        profile.generatedDocs.ewb.push(valueToBeSaved);
        updateProfile(profile);
      }
      // return the success values 
      return { success: true, data: ewbDetails };
    }
    
    throw { success: false, msg: res.msg };
  }
  catch (exc) {
    console.log(`GetEWB.component.exception : ${exc}`);
    throw { success: false, msg: exc};
  }
}

methods.generateEWB = async (profileId, userId, ewbData) => {
  try {
    // Fetch the profile and token from given profile & user ID
    const tokenAndProfileRes = await methods.getToken(profileId, userId)
      .catch((err) => {
        throw { success: false, msg: err };
      })

    console.log(`GenerateEWB.tokenAndProfileRes.response : ${JSON.stringify(tokenAndProfileRes)}`);
    if (!tokenAndProfileRes.success) {
      throw { success: false, msg: 'Unable to fetch token and profile details.' };
    }
    const { token, profile } = tokenAndProfileRes.data;
    // After the profile is received, get the auth token for the API.
    if (!profile) {
      throw { success: false, msg: 'Token Generated, but failed to fetch profile' };
    }
    const result = await generateEWB(ewbData, token, profile, true)
      .catch((err) => {
        console.log(`GenerateEWB.resultGenerateEWB.error : ${err}`)
        throw { success: false, msg: err };
      })

    console.log(`GenerateEWB.resultGenerateEWB.response : ${result}`);
    if (result){
      if(result.success) {
        return { success: true, data: result };
      }
      throw { success: false, msg: result.msg };
    }
    throw { success: false, msg: 'Failed to generate EWB' };
  }
  catch (exc) {
    console.log(exc);
    throw { success: false, msg: exc };
  }
}

module.exports = methods;