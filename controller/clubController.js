const multer = require("multer");
const multerImageStorage = multer.memoryStorage();
const Category = require("../model/categoryModel");
const Club = require("../model/clubModel");
const Event = require("../model/eventModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync.js");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const LeaderBoard = require("../model/leaderBoardModel");
const sharp = require("sharp");
const { S3Upload } = require("../utils/aws-s3.js");
const { base } = require("../utils/public.js");
const validator = require("validator");

const multerImageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};
const uploadImage = multer({
  storage: multerImageStorage,
  fileFilter: multerImageFilter,
});

exports.uploadcoverImage = uploadImage.fields([{ name: "image", maxCount: 1 }]);

exports.resizeImage = catchAsync(async (req, res, next) => {
  //   if (!req.files)
  //     return next(new AppError("You must provide at least one image", 400));
  //   console.log("File pdf", req.files);
  await Promise.all(
    req.files.image.map(async (file, i) => {
      const filename = `event-${req._club.name.split(" ")[0]}-${Date.now()}-${
        i + 1
      }.jpeg`;
      const file1 = await sharp(file.buffer)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`${base}/event/${filename}`);

      switch (process.env.EVENT_STORAGE) {
        case "S3":
          const awsurl = await S3Upload(`${filename}`, "event");
          req.body.coverImage = awsurl;
          break;
        case "C":
          const result = await cloudinary.uploader.upload(
            `${base}/event/${filename}`
          );
          req.body.coverImage = result.secure_url;
          break;
      }
    })
  );
  next();
});

exports.forceAuthState = (state = true) => {
  return catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      if (state) {
        return next(new AppError("Kindly Login", 400));
      }
      return next();
    } else {
      const payload = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      if (payload) {
        if (!state) {
          return next(new AppError("Kindly logout", 400));
        }
        req._club = await Club.findById(payload._id);
      } else {
        if (state) {
          return next(new AppError("Session expired", 401));
        }
      }
    }
    next();
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { email, password, confirmpassword, name } = req.body;
  let club = await Club.findOne({ email });
  if (club) {
    return next(new AppError("Already registered, login", 400));
  }
  if (password != confirmpassword) {
    return next(new AppError("Passwords don't match", 400));
  }

  club = await Club.create({
    email,
    password,
    name,
  });

  return res.status(200).json({
    status: "success",
    message: "Club created successfully",
  });
});

exports.modifyClub = catchAsync(async (req, res, next) => {
  const club = await Club.findByIdAndUpdate(req._club._id, req.body, {
    new: true,
  });
  return res.status(200).json({
    status: "success",
    message: "Club modified successfully",
    club: club,
  });
});

exports.getClub = catchAsync(async (req, res, next) => {
  const club_id = req.params.id;
  const club = await Club.findById(club_id).select("-password -email");
  if (!club) {
    return next(new AppError("Club not found", 404));
  }
  return res.status(200).json({ club });
});

exports.signIn = catchAsync(async (req, res, next) => {
  let { email, password } = req.body;
  email = email?.toLowerCase().trim();
  if (!validator.isEmail(email)) {
    return next(new AppError("Invalid email", 400));
  }
  const club = await Club.findOne({ email });
  if (!club) {
    return next(new AppError("Email not found", 400));
  }

  if (!club.verifyPassword(password)) {
    return next(new AppError("Invalid password", 400));
  }
  req._club = club;
  const token = jwt.sign({ _id: club._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN_CLUB,
  });
  res.status(200).json({
    status: "success",
    message: "Login successful",
    token,
    clubId: club._id,
  });
});

exports.createEvent = catchAsync(async (req, res, next) => {
  const { catname } = req.body;
  const category = await Category.findOne({ name: catname });

  if (!category) {
    return next(new AppError("Category not found", 400));
  }

  const event = await Event.create({
    name: req.body?.name.trim(),
    description: req.body?.description.trim(),
    image: req.body.coverImage,
    dates: {
      day1: req.body.day1,
      day2: req.body.day2,
      day3: req.body.day3,
    },
    category: catname,
    place: req.body.place?.trim(),
    club: req._club._id,
    contacts: req.body.contacts,
    registrationLink: req.body.registrationLink || "",
  });

  category.events.push(event._id);
  category.save({ validateBeforeSave: false });

  req._club.events.push(event._id);
  req._club.save({ validateBeforeSave: false });

  return res.status(200).json({
    status: "success",
    message: "Event created successfully",
    event: event,
  });
});

exports.getEvents = catchAsync(async (req, res, next) => {
  const club = await req._club.populate("events");
  return res.status(200).json({
    status: "success",
    message: "Events fetched successfully",
    events: club.events,
  });
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const { eventId } = req.body;
  const event = await Event.findOneAndDelete({
    _id: eventId,
    club: req._club._id,
  });
  if (!event) {
    return next(new AppError("Event not found", 400));
  }
  await Category.updateOne(
    { name: event.category },
    { $pull: { events: { $eq: event._id } } }
  );
  req._club.events = req._club.events.filter((e) => e != eventId);
  req._club.save({ validateBeforeSave: false });

  return res.status(200).json({
    status: "success",
    message: "Event deleted successfully",
    event,
  });
});

exports.modifyEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findOneAndUpdate(
    { _id: req.body._id, club: req._club._id },
    req.body,
    { new: true }
  );

  if (!event) {
    return next(new AppError("No events updated", 400));
  }

  return res.status(200).json({
    status: "success",
    message: "Event successfully modified",
    event: event,
  });
});

exports.getParticipants = catchAsync(async (req, res, next) => {
  const { eventId } = req.body;
  let event = await Event.findOne({
    _id: eventId,
    club: req._club._id,
  }).populate({
    path: "participants",
    select: "name teamLeader",
    populate: { path: "teamLeader", select: "name" },
  });
  if (!event) {
    return next(new AppError("Event not found", 404));
  }
  return res.status(200).json({
    status: "success",
    message: "Participants fetched successfully",
    participants: event.participants,
  });
});

exports.postScore = catchAsync(async (req, res, next) => {
  const { eventId } = req.body;
  // console.log(req.body);

  let e = await Event.findById(eventId);
  if (!e) {
    return next(new AppError("Event not found", 400));
  }

  if (e.leaderBoard) {
    return next(new AppError("Leaderboard already posted", 400));
  }

  const category = await Category.findOne({ name: e.category });

  const cScores = [category.maxScore, category.middleScore, category.minScore];

  req.body.score = req.body.score.filter(
    (team) => team != null && team != undefined && team._id != undefined
  );

  if (!req.body.score.length) {
    return next(new AppError("No scores added", 400));
  }
  // res.send("Hi");

  const leaderboard = await LeaderBoard.create({
    event: eventId,
    score: req.body.score.map((team, i) => ({
      team: team?._id,
      point: cScores[i],
      teamName: team?.name,
    })),
  });

  const event = await Event.findOneAndUpdate(
    { _id: eventId, club: req._club._id },
    {
      leaderBoard: leaderboard._id,
    }
  );

  // if (req.body.score.length != event.participants.length)
  //   return next(
  //     new AppError(
  //       "Look like, not as many members have participated as many scores are added",
  //       400
  //     )
  //   );
  res.status(200).json({
    message: "Score successfully updated",
    status: "success",
    data: leaderboard,
  });
});

exports.getAllClubs = catchAsync(async (req, res, next) => {
  const clubs = await Club.find().select("-password -email");
  return res
    .status(200)
    .json({ status: "success", message: "Clubs fetched successfully", clubs });
});
