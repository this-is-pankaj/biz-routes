const ewbTokenMethod = require('../interface/ewb.token.interface');
const utils = require('../utils/utils');

const methods = {};

methods.generateToken = async (req, res) => {
  try {
    const profileId = req.query.profileId;
    console.log(`Incoming profileId: ${profileId}`);

    if(!profileId) {
      return utils.handleResponse(res, 400, 'Invalid Profile', null);
    }

    const token = await ewbTokenMethod.getToken(profileId)
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

module.exports = methods;