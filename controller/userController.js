const User = require("../model/userModel");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Email = require("./../utils/email");
const EmailId = require("./../model/emailModel");
const crypto = require("crypto");
const validator = require("validator");
///////////////////Token Creation///////////////////////////
const signToken = (id, purpose, res) => {
  if (purpose == "otp")
    return jwt.sign({ id }, process.env.JWT_SECRET_OTP, {
      expiresIn: process.env.JWT_EXPIRES_IN_OTP,
    });
  if (purpose == "login") {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
    return token;
  }
};

exports.DoesUserExist = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }

  if (!validator.isEmail(req.body.email)) {
    return next(new AppError("Invalid email", 400));
  }

  const user = await User.findOne({ email: req.body.email }).select(
    "+verified"
  );
  if (user) {
    // console.log(user.otp_created_at)
    // if (!user.verified) await User.deleteOne({ email: req.body.email });
    // if (user.verified)
    //   return next(new AppError("User already exists, Kindly login", 400));
    if (user.verified) {
      // return res.json()
      return next(new AppError("User already exists, kindly login", 400));
    } else {
      await User.deleteOne({ email: req.body.email });
    }
  }
  next();
});

const genRoll = (email) => {
  const regex = /^([a-zA-Z]+)(\d+)\.(\d+)@bitmesra\.ac\.in$/;
  const match = email.match(regex);
  if (match) {
    let [, course, roll, year] = match;
    if (course == "btech") {
      course = "B.TECH";
    }
    return `${course.toUpperCase()}/${roll}/${year}`;
  }
  return null;
};

exports.signupcreate = catchAsync(async (req, res, next) => {
  // console.log(req.body);
  ////////////////Generating 4 digit otp/////////////////////////////
  //////////////////////////////////////////////////////////////////
  const otp = crypto.randomInt(1000, 9999);
  req.body.otp = otp;
  /////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  //////////Sending OTP through mail//////////////////////////

  const regexMain = /^[a-zA-Z]+1[01]\d+\.\d{2}@bitmesra\.ac\.in$/i;
  const regexLalpur = /^[a-zA-Z]+4[01]\d+\.\d{2}@bitmesra\.ac\.in$/i;

  let roll_num = "";

  if (regexMain.test(req.body.email) || regexLalpur.test(req.body.email)) {
    if (regexMain.test(req.body.email)) {
      req.body.transaction_status = "locked";
      req.body.transaction = true;
    }
    roll_num = genRoll(req.body.email);
  } else {
    return next(
      new AppError(
        "Emails outside BIT main campus and Lalpur campus are not allowed",
        400
      )
    );
  }

  const email1 = await EmailId.findOneAndUpdate(
    { limit: { $gt: 0 } },
    { $inc: { limit: -1 } }
  ); // //   console.log(email1);
  if (email1 == null) {
    return next(new AppError("Registration closed for the day", 400));
  }
  const i = email1.limit % email1.email.length;
  const mail = await new Email(
    req,
    email1.email[i],
    email1.password[i]
  ).sendOTP();
  if (mail?.err) {
    return next(new AppError("Some error occurred while sending email", 400));
  }

  const username = req.body.email.split("@")[0];
  const user = await User.create({
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    password: req.body.password,
    confirmpassword: req.body.confirmpassword,
    college: req.body.college.trim(),
    otp,
    otp_created_at: Date.now(),
    bitotsavId: `BIT_${username}#2024`,
    rollNum: roll_num,
    transaction_status: req.body.transaction_status,
    transaction: req.body.transaction || false,
  });
  const token = signToken(user._id, "otp");
  res.status(200).json({
    status: "success",
    message: "Please, verify your mailId",
    token,
  });
});

exports.getLoginToken = catchAsync(async (req, res, next) => {
  const token = signToken(req._user._id, "login");
  return res.status(200).json({
    status: "success",
    message: "Login successfull",
    token,
    user: req._user,
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const token = signToken(req._user._id, "login", res);
  return res.status(200).json({
    status: "success",
    message: "Login successfull",
    token,
    user: req._user,
  });
});

exports.getUserDetail = catchAsync(async (req, res, next) => {
  const user = await User.findById(req._user._id)
    .populate({
      path: "teamId",
      populate: [
        { path: "members", select: "email name college bitotsavId" },
        {
          path: "eventsParticipatedIn",
          select: "name category",
        },
      ],
    })
    .select("-entry -transaction -otp_created_at -otp -passwordChangedAt");
  res.status(200).json({
    status: "success",
    message: "Data Successfully fetched",
    user,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email.toLowerCase().trim();
  const user = await User.findOne({ email }).select("+verified");
  // console.log({ user });
  if (!user || !user.verified) {
    return next(new AppError("No such user exists", 400));
  }

  const otp = crypto.randomInt(1000, 9999);
  req.body.otp = otp;
  user.otp = otp;
  await user.save({ validateBeforeSave: false });
  const email1 = await EmailId.findOneAndUpdate(
    { limit: { $gt: 0 } },
    { $inc: { limit: -1 } }
  );
  if (email1 == null) {
    return next(new AppError("Registration closed for the day", 400));
  }
  const i = email1.limit % email1.email.length;
  const mail = await new Email(
    req,
    email1.email[i],
    email1.password[i]
  ).sendPasswordReset();
  if (mail?.err) {
    return next(new AppError("Some error occurred while sending email", 400));
  }
  const token = signToken(user._id, "otp");
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.PasswordresetOTPVerify = catchAsync(async (req, res, next) => {
  const token = req.params.token;
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_OTP
  );
  const currentUser = await User.findById(decoded.id);
  if (req.body.otp == currentUser.otp) {
    currentUser.password = req.body.password;
    currentUser.confirmpassword = req.body.confirmpassword;
    await currentUser.save();
    res.status(200).json({
      status: "success",
      message: "Password successfully Changed, kindly login",
    });
  } else return next(new AppError("Invalid OTP", 400));
});
