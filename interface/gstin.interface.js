const axios = require('axios');
const mongoose = require('mongoose');
const collectionName = 'companyDetails';
const methods = {};

const config = require(`../config/${process.env.Node_ENV || 'local'}`);
const utils = require('../utils/utils');

// Mapper that maps response keys to response keys
const fieldMapper = {
  gstin: 'gstin',
  tradeNam: 'tradeName',
  nba: 'natureOfBusiness',
  rgdt: 'dateOfRegistration',
  pradr: 'prAddress',
  adadr: 'adAddress'
};

// The method to send the desired JSON structure for every gstin related query
const mapFields = (rawData) => {
  const resObj = {};
  if(!rawData || !rawData.gstin) {
    return resObj;
  }
  for(let k in fieldMapper) {
    resObj[fieldMapper[k]] = rawData[k];
  }
  return resObj;
}

// get GST details from local saved DBs
const getSavedCompanyInfo = async (gstin) => {
  try {
    const q = {
      gstin: gstin
    };

    const gstCollection = mongoose.connection.db.collection(collectionName)
    // .
      // .catch((err) => {
      //   console.log(`GSTIN.GetSavedCompanyInfo.collection.error ${err}`);
      //   throw {success: false, msg: err};
      // });

    const companyInfo = await gstCollection.findOne(q)
        .catch((err) => {
          console.log(`GSTIN.GetSavedCompanyInfo.company.error ${err}`);
          throw {success: false, msg: err};
        })

    return companyInfo;
  }
  catch(exc) {
    console.log(`GSTIN.GetSavedCompanyInfo.exception ${exc}`);
    throw {success: false, msg: exc};
  }
}

// Get the company information from the GST External API 
const getCompanyInfoFromAPI = async (gstin) => {
  try {
    const info = await axios({
        method: 'GET',
        url: config.gstInfo.url
      })
      .catch((err) => {
        console.log(`GSTIN.getCompanyInfoFromAPI.error ${err}`);
        throw {success: false, msg: err};
      });
    
    return info;
  }
  catch(exc) {
    console.log(`GSTIN.getCompanyInfoFromAPI.exception ${exc}`)
    throw {success: false, msg: exc};
  }
}

// Method to get the company Details from a gstin number
methods.getCompanyInfo = async (req, res) => {
  try {
    if(!req.userId) {
      utils.handleResponse(res, 401, 'User is not authorized', null);
    }
    else {
      const gstin = req.query.gstin;
      if(!gstin) {
        return utils.handleResponse(res, 400, 'No GST number to validate', null);
      }
      
      // First lookup for the GST details in the DB
      const compInfo = await getSavedCompanyInfo(gstin)
        .catch(async (err) => {
          // Make call to the sourceAPI to get the details
          const infoFromSrc = await getCompanyInfoFromAPI(gstin)
            .catch((err) => {
              utils.handleResponse(res, 500, err, null);
            })
          return infoFromSrc;
        });
        
      if(compInfo && compInfo.gstin) {
        return utils.handleResponse(res, 200, null, mapFields(compInfo));
      }
      utils.handleResponse(res, 204, null, compInfo);
    }
  }
  catch(exc) {
    console.log(exc);
    utils.handleResponse(res, 500, exc, null);
  }
}
module.exports = methods;