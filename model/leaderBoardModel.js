const mongoose = require("mongoose");
const Event = require("./eventModel");
const leaderBoardSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: "Event",
    unique: [true, "An event can have only one leaderboard"],
  },
  // eventDetail: {
  //   type: String,
  // },
  score: [
    {
      team: {
        type: mongoose.Schema.ObjectId,
        ref: "Team",
      },
      point: {
        type: Number,
        default: 0,
      },
      teamName: {
        type: String,
        required: [true, "Team Name is required"],
      },
    },
  ],
});
leaderBoardSchema.pre("save", async function (next) {
  await this.populate({ path: "event" });
  next();
});
// leaderBoardSchema.pre("aggregate", async function (next) {
//   this.populate("event");
// });
leaderBoardSchema.post("aggregate", async function (doc, next) {
  //   console.log(doc);
  let eventIds = [];
  doc.forEach((el, index) => {
    eventIds.push({ _id: el.event });
  });

  const event = await Event.find({ $or: [...eventIds] })
    .select("name description image place dates")
    .sort({ event: -1 });
  doc.sort((a, b) => (a.event < b.event ? -1 : 1));
  doc.forEach((element, index) => {
    element.event = event[index];
  });
  //   console.log("Aggregate", this.populate({ path: "event" }));
  next();
});
const LeaderBoard = mongoose.model("LeaderBoard", leaderBoardSchema);
module.exports = LeaderBoard;
