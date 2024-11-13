const mongoose = require("mongoose");
const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "An event should have a name"],
  },
  description: {
    type: String,
    minlength: [5, "Description should not be below hundered words"],
    required: [true, "Description is required"],
  },
  image: {
    type: String,
    required: [true, "An event should have an image"],
  },
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Team",
    },
  ],
  place: {
    type: String,
    required: [true, "You must mention the Place"],
  },
  dates: {
    day1: { start: Date, end: Date },
    day2: { start: Date, end: Date },
    day3: { start: Date, end: Date },
  },
  category: {
    type: String,
    required: [true, "An event should belong to a category"],
  },
  leaderBoard: {
    type: mongoose.Schema.ObjectId,
    ref: "LeaderBoard",
  },

  registrationLink: String,
  contacts: [String],
  club: {
    type: mongoose.Schema.ObjectId,
    ref: "Club",
  },
});
const Event = mongoose.model("Event", eventSchema);
module.exports = Event;
