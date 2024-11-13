const mongoose = require("mongoose");
const emailSchema = new mongoose.Schema({
  email: {
    type: [String],
  },
  password: {
    type: [String],
  },
  limit: {
    type: Number,
  },
});
const EmailId = mongoose.model("EmailId", emailSchema);
module.exports = EmailId;
