const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const clubSchema = new mongoose.Schema({
  name: String,
  description: String,
  logo: String, // url
  social: {
    linkedin: String,
    facebook: String,
    instagram: String,
    contact: String,
  },
  tagline: String,
  isTech: Boolean,
  website: String,
  events: [{ type: mongoose.Schema.ObjectId, ref: "Event" }],
  email: String,
  password: String,
});

clubSchema.methods = {
  hashPassword: function (password) {
    return bcrypt.hashSync(password, 10);
  },
  verifyPassword: function (password) {
    return bcrypt.compareSync(password, this.password);
  },
};

clubSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

const Club = mongoose.model("Club", clubSchema);

module.exports = Club;
