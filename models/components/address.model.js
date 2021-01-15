module.exports = {
  "line1": {
    type: String,
    required: true
  },
  "line2": {
    type: String
  },
  "line3": {
    type: String
  },
  "city": {
    type: String,
    required: true
  },
  "state": {
    type: String,
    required: true
  },
  "pinCode": {
    type: String,
    required: true
  },
  "country": {
    type: String,
    required: true,
    default: 'India'
  }
}