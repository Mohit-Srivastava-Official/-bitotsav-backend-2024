const mongoose = require("mongoose");
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A category should have a name"],
  },

  maxScore: Number,
  middleScore: Number,
  minScore: Number,

  events: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Event",
    },
  ],
  image: String,
});
const Category = mongoose.model("Category", categorySchema);
module.exports = Category;
