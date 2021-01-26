const ewbInterfaceMethod = require('../interface/ewb.interface');
const utils = require('../utils/utils');

const methods = {};

methods.generateToken = async (req, res) => {
  try {
    const profileId = req.query.profileId;

    if(!profileId) {
      return utils.handleResponse(res, 400, 'Invalid Profile', null);
    }

    if(!req.userId) {
      return utils.handleResponse(res, 401, 'User not authorized', null);
    }

    const token = await ewbInterfaceMethod.getToken(profileId, req.userId)
      .catch((err) => {
        return utils.handleResponse(res, 500, err, null);
      });

    console.log(`Token value received: ${token}`);
    if(token.success) {
      return utils.handleResponse(res, 200, null, token.data);
    }

    utils.handleResponse(res, 500, 'Issue fetching the token. Please retry after sometime', null);
  }
  catch(exc) {
    utils.handleResponse(res, 500, exc, null);
  }
}

methods.generateNewEWB = async (req, res) => {
  try {
    console.log('Executing GenerateNewEWB')
    const ewbFormData = req.body;
    const profileId = req.query.profileId;

    if(!ewbFormData) {
      return utils.handleResponse(res, 400, 'Invalid Form Data', null);
    }
    
    if(!profileId) {
      return utils.handleResponse(res, 400, 'Unable to identify the profile to generate EWB', null);
    }
    if(!req.userId) {
      return utils.handleResponse(res, 401, 'User not authorized', null);
    }

    const ewbTransaction = await ewbInterfaceMethod.generateEWB(profileId, req.userId, ewbFormData)
      .catch((err) => {
        console.log(`generateNewEWB.ewbTransaction.error: ${JSON.stringify(err)}`);
        return utils.handleResponse(res, 500, err, null);
      })

    if(ewbTransaction && ewbTransaction.success) { 
      return utils.handleResponse(res, 200, null, ewbTransaction.data);
    }
    utils.handleResponse(res, 500, 'Issue generating EWB. Please retry after sometime.', null);
  }
  catch(exc) {
    utils.handleResponse(res, 500, exc, null);
  }
}
module.exports = methods;