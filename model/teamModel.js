const mongoose = require("mongoose");
const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name of the team is required"],
    unique: [true, "Team name must be unique"],
  },
  teamLeader: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "A team must have a leader"],
  },
  members: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  eventsParticipatedIn: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Event",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  teamIndentity: {
    type: String,
  },
});

teamSchema.index(
  { name: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
