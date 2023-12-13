const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  url: {
    type: String,
    // You can add other validations or default values if needed
  },
  phone: {
    type: String,
  },
  website: {
    type: String,
    // You can add other validations or default values if needed
  },
  state: {
    type: String,
    // You can add other validations or default values if needed
  },
});

const BusinessModel = mongoose.model("Business", businessSchema);

module.exports = BusinessModel;
