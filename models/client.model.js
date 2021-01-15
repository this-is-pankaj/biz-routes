const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = require('./components/address.model');

const ClientSchema = new Schema({
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
  "addresses": [ 
    {
      ...AddressSchema,
      "nick": {
        type: String,
        required: true
      }
    }
  ]
});

module.exports = mongoose.model('clients', ClientSchema);