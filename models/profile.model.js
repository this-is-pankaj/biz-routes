const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NameSchema = require('./components/name.model');
const AddressSchema = require('./components/address.model');

const ProfileSchema = new Schema({
  "userId": {
    type: String,
    required: true
  },
  "nick": {
    type: String,
    required: true
  },
  "gstin": {
    type: String,
    required: true
  },
  "companyName": {
    type: String,
    required: true
  },
  "contactPerson": {
    ...NameSchema,
    "email": {
      type: String
    },
    "phone": {
      type: String
    },
    "designation": {
      type: String
    }
  },
  "addresses": [ 
    {
      ...AddressSchema,
      "nick": {
        type: String,
        required: true
      }
    }
  ],
  "savedDocs": {
    "ewb": [
      { }
    ]
  },
  "generatedDocs": {
    "ewb": [
      {
        "num": {
          type: String
        },
        "url": {
          type: String
        },
        "createdOn": {
          type: Date,
          default: Date.now
        }
      }
    ]
  }
});

module.exports = mongoose.model('profiles', ProfileSchema);