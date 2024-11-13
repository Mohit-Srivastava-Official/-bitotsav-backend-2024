const QRcode = require("qrcode");
const AppError = require("./appError");
const catchAsync = require("./catchAsync");
const cloudinary = require("./../utils/cloudinary");
const User = require("./../model/userModel");
const { S3Upload } = require("./aws-s3");
const { base } = require("./public");
exports.generateQR = catchAsync(async (req, res, next) => {
  if (req._user.QRcode) return next();
  if (!req._user.transaction || !req._user.verified)
    return next(
      new AppError(
        "Please complete your transaction in order to generate QRCode",
        400
      )
    );

  await QRcode.toFile(
    `${base}/qr/${req._user._id}.png`,
    `https://www.bitotsav.in/entry/${req._user._id}`
  );

  switch (process.env.QR_STORAGE) {
    case "S3":
      const awsurl = await S3Upload(req._user._id + ".png", "qr");
      req._user.QRcode = awsurl;
      break;
    case "C":
      const result = await cloudinary.uploader.upload(
        `${base}/qr/${req._user._id}.png`
      );
      req._user.QRcode = result.secure_url;
  }

  await req._user.save({ validateBeforeSave: false });
  return next();
});

exports.getQR = catchAsync(async (req, res, next) => {
  return res.status(200).json({
    status: "success",
    url: req._user.QRcode,
  });
});

exports.checkAdmin = catchAsync(async (req, res, next) => {
  // console.log("users", req._user);
  // if (req._user.role == "user")
  if (["user", "participant"].includes(req._user.role))
    return next(new AppError("You are not allowed to access this route", 400));
  else next();
});

exports.verifyEntry = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  const date = new Date(Date.now());
  const day1 = new Date(2024, 2, 15, 5, 30);
  const day2 = new Date(2024, 2, 16, 5, 30);
  const day3 = new Date(2024, 2, 17, 5, 30);
  // console.log({ date, day1, day2, day3 });
  if (date.getMonth() == day1.getMonth() && date.getDate() == day1.getDate())
    if (user.entry.day1) {
      user.entry.day1 = false;
      user.save({ validateBeforeSave: false });
      return res.status(200).json({
        message: "User may enter",
        status: "success",
      });
    } else {
      return res.status(200).json({
        message: "User cannot enter",
        status: "error",
      });
    }
  if (date.getMonth() == day2.getMonth() && date.getDate() == day2.getDate()) {
    console.log([user.name, user.email, user.entry.day2]);
    if (user.entry.day2) {
      user.entry.day2 = false;
      user.save({ validateBeforeSave: false });
      return res.status(200).json({
        message: "User may enter",
        status: "success",
      });
    } else {
      return res.status(200).json({
        message: "User cannot enter",
        status: "error",
      });
    }
  }
  if (date.getMonth() == day3.getMonth() && date.getDate() == day3.getDate()) {
    console.log([user.name, user.email, user.entry.day3]);
    if (user.entry.day3) {
      user.entry.day3 = false;
      user.save({ validateBeforeSave: false });
      return res.status(200).json({
        message: "User may enter",
        status: "success",
      });
    } else {
      return res.status(200).json({
        message: "User cannot enter",
        status: "error",
      });
    }
  }
  return res.status(400).json({
    message: "No such record found",
    status: "error",
  });
});
