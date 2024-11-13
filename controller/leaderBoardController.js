const catchAsync = require("../utils/catchAsync");
const LeaderBoard = require("../model/leaderBoardModel");
const AppError = require("../utils/appError");
const Event = require("./../model/eventModel");

exports.checkAdmin = catchAsync(async (req, res, next) => {
  if (req._user.verified && req._user.role == "admin") {
    return next();
  } else
    return next(new AppError("You are not allowed to access this route", 400));
});

exports.postScore = catchAsync(async (req, res, next) => {
  eventId = req.params.eventId;
  const leaderBoard = await LeaderBoard.create({
    event: eventId,
    score: req.body.score,
  });
  //   console.log(leaderBoard);
  const event = await Event.findOneAndUpdate(
    { _id: eventId },
    { leaderBoard: leaderBoard._id }
  );
  if (req.body.score.length != event.participants.length)
    return next(
      new AppError(
        "Look like, not as many members have participated as many scores are added",
        400
      )
    );
  res.status(200).json({
    message: "Score successfully updated",
    status: "success",
    data: "leaderBoard",
  });
});

exports.totalScore = catchAsync(async (req, res, next) => {
  const leaderBoard = await LeaderBoard.aggregate([
    { $unwind: { path: "$score" } },
    {
      $group: {
        _id: "$score.team",
        point: { $sum: "$score.point" },
        teamName: { $first: "$score.teamName" },
      },
    },
    { $sort: { point: -1 } },
  ]);
  res.status(200).json({
    status: "success",
    message: "Data fetched successfully",
    data: leaderBoard,
  });
});

exports.getScoreEventWise = catchAsync(async (req, res, next) => {
  const leaderBoard = await LeaderBoard.findOne({
    event: req.params.eventId,
  });
  res.status(200).json({
    message: "Data successfully fetched",
    status: "success",
    data: leaderBoard,
  });
});

exports.getScoreTeam = catchAsync(async (req, res, next) => {
  //   console.log(req._user.teamId);
  const leaderBoard = await LeaderBoard.aggregate()
    .unwind({ path: "$score" })
    .match({ "score.team": req._user.teamId })
    .exec();
  //   const leaderBoard = await LeaderBoard.find({
  //     "score.team": req._user.teamId,
  //   });
  leaderBoard.forEach((element) => {
    element.event = element.event.name;
    element.score = element.score.point;
  });
  res.status(200).json({
    status: "success",
    message: "Data successfully fetched",
    data: leaderBoard,
  });
});
