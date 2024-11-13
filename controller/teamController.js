const Team = require("./../model/teamModel");
const Event = require("./../model/eventModel");
const User = require("./../model/userModel");
const appError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.registerTeam = catchAsync(async (req, res, next) => {
  let emailId = req.body.email; // an array of emails

  if (!emailId || !req.body.name) {
    return next(new appError("Team name and emails ids of members are required", 400));
  }

  emailId = emailId?.map((email) => email.toLowerCase().trim()) || [];
  const leaderEmail = req.body.email[0];
  emailId = [...new Set(emailId)].filter((email) => email !== "");

  if (leaderEmail !== req._user.email) {
    return next(new appError("You need to be the leader of your team", 400));
  }

  if (emailId.length < 3) {
    return next(
      new appError("Minimum 3 members are required to register a team", 400)
    );
  }

  const user = await User.find({
    $or: emailId.map((email) => ({ email })),
    verified: true,
  });
  ///////////////////////////////////////////////////////////////////////
  ////////////To check valid users///////////////////////////////////////

  let includeId = [];
  let userId = [];
  //   console.log(req._user._id);
  user.forEach((element) => {
    userId.push(element._id);
    includeId.push(element.email);
  });
  // console.log(userId);
  //   console.log("user", userId, userId.includes(req._user._id));
  //   if (!userId.includes(req._user._id)) {
  //     return next(new appError("Only a member of the team can register", 400));
  //   }
  if (emailId.length !== user.length) {
    var result = emailId.filter((element) => {
      return !includeId.includes(element);
    });
    // return res.status(400).json({
    //   status: "error",
    //   message: "Looks like, few of your members have not yet signed up",
    //   data: result,
    // });
    return next(
      new appError(
        "Looks like, few of your members have not yet signed up",
        400
      )
    );
  }
  // console.log("heey", emailId[0]);
  const leader = await User.find({ email: leaderEmail });
  // console.log(leader);
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////To check if the user belong to any other team//////////////////

  const checkTeamMemeber = await Team.find({ members: { $in: userId } });
  if (checkTeamMemeber.length)
    return next(
      new appError("Few of the memebers already belongs to another team", 400)
    );

  req.body.name = req.body.name.trim();
  let t0 = await Team.findOne({
    name: { $regex: new RegExp("^" + req.body.name + "$", "i") },
  });

  if (t0) {
    return next(new appError("Team name already taken", 400));
  }

  const team = await Team.create({
    name: req.body.name,
    teamLeader: leader[0]._id,
    members: userId,
  });
  await User.updateMany(
    {
      $or: emailId.map((email) => ({ email })),
      verified: true,
    },
    { role: "participant", teamId: team._id }
  );

  res.status(200).json({
    message:
      "Team successfully registered, All your team memebers are registered as Participant",
    status: "success",
    data: team,
  });
});

//////////////////////Participating////////////////////////
exports.participateInEvent = catchAsync(async (req, res, next) => {
  const teamId = req._user.teamId;
  if (!teamId)
    return next(new appError("You are not registered in any team", 400));
  const team = await Team.findOne({ _id: teamId });
  if (!team) {
    return next(new appError("Team not found", 400));
  }
  const members = team.members;
  //   console.log({members});
  if (!members.includes(req._user._id))
    return next(new appError("You are not a part of this team", 400));
  //   console.log({team});
  if (team.eventsParticipatedIn.includes(req.params.eventId))
    return next(new appError("You have already registered in this event", 400));

  team.eventsParticipatedIn.push(req.params.eventId);
  const event = await Event.updateOne(
    { _id: req.params.eventId },
    { $push: { participants: team._id } }
  );
  //   console.log("eventsssss", event);
  await team.save({ validateBeforeSave: false });
  res.status(200).json({
    message: "Successfully registered",
    status: "success",
    data: team,
  });
});

////////////////////Get All Participated Event List////////////////////

exports.getAllParticipatedEvent = catchAsync(async (req, res, next) => {
  const teamId = req._user.teamId;
  if (!teamId)
    return next(new appError("You are not registered in any team", 400));
  const team = await Team.findById(teamId).populate({
    path: "eventsParticipatedIn",
  });
  res.status(200).json({
    status: "success",
    message: "Events successfully fetched",
    data: team,
  });
});
