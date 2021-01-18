const axios = require('axios');
const mongoose = require('mongoose');
const collectionName = 'companyDetails';
const methods = {};

const config = require(`../config/${process.env.Node_ENV || 'local'}`);
const utils = require('../utils/utils');

// Mapper that maps response keys to response keys
const fieldMapper = {
  gstin: 'gstin',
  tradeName: 'tradeNam',
  natureOfBusiness: 'nba',
  dateOfRegistration: 'rgdt',
  permAddress: 'pradr.addr',
  adAddress: 'adadr.0.addr'
};

// The method to send the desired JSON structure for every gstin related query
const mapFields = (rawData) => {
  const resObj = {};
  if(!rawData || !rawData.gstin) {
    return resObj;
  }
  for(let k in fieldMapper) {
    let fieldToBeMapped = fieldMapper[k];
    // Check if the field has some parent property in the state..
    const fields = fieldToBeMapped.split('.');
    let valueToBeMapped = {...rawData};
    // If fields were nested, loop over and update the correct property
    if(fields.length>1) {
      fieldToBeMapped = fields.pop();   // take the final fieldName to be later assigned value to
      for(let f of fields) {
        valueToBeMapped = valueToBeMapped[f] || {}
      }
    }
    resObj[k] = valueToBeMapped[fieldToBeMapped];
  }
  return resObj;
}

// get GST details from local saved DBs
const getSavedCompanyInfo = async (gstin) => {
  const gstCollection = mongoose.connection.db.collection(collectionName);
  try {
    const q = {
      gstin: gstin
    };

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
  const gstCollection = mongoose.connection.db.collection(collectionName);
  try {
    const info = await axios({
        method: 'GET',
        url: config.gstInfo.url
      })
      .catch((err) => {
        console.log(`GSTIN.getCompanyInfoFromAPI.error ${err}`);
        throw {success: false, msg: err};
      });
    // The fetched info needs to be saved in our local DB, so trigger that in the background
    saveCompanyInfoToDB(info);
    return info;
  }
  catch(exc) {
    console.log(`GSTIN.getCompanyInfoFromAPI.exception ${exc}`)
    throw {success: false, msg: exc};
  }
};

// Save the company Info into the DB for future reference.
const saveCompanyInfoToDB = (info) => {
  const gstCollection = mongoose.connection.db.collection(collectionName);
  try{
    if(!info || !info.gstin) {
      console.log(`GSTIN.saveCompanyInfoToDB.noInfo ${info}`);
      return;
    }
    gstCollection.insertOne(info)
      .then((doc) => {
        console.log(`GSTIN.saveCompanyInfoToDB.savedDoc ${doc}`);
      })
      .catch((err) => {  
        console.log(`GSTIN.saveCompanyInfoToDB.error ${exc}`);
      })
  }
  catch(exc) {
    console.log(`GSTIN.saveCompanyInfoToDB.exception ${exc}`);
  }
};

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