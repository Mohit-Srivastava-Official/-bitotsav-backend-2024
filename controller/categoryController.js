const multer = require("multer");
const sharp = require("sharp");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const multerImageStorage = multer.memoryStorage();
const Category = require("./../model/categoryModel");
const cloudinary = require("./../utils/cloudinary");
const { S3Upload } = require("../utils/aws-s3");
const { base } = require("../utils/public");

// * Check for admin
exports.checkAdmin = catchAsync(async (req, res, next) => {
  if (req._user.role == "admin") return next();
  else
    return next(
      new AppError("You don't have permission to access this route", 400)
    );
});
//////////////////////////////////////////////////

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
      const filename = `category-${req.body.name}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`${base}/category/${filename}`);

      switch (process.env.CATEGORY_STORAGE) {
        case "S3":
          const awsurl = await S3Upload(filename, "category");
          req.body.coverImage = awsurl;
          break;
        case "C":
          const result = await cloudinary.uploader.upload(
            `${base}/category/${filename}`
          );
          req.body.coverImage = result.secure_url;
          break;
      }
    })
  );
  next();
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create({
    name: req.body.name,
    image: req.body.coverImage,
    maxScore: req.body.maxScore,
    middleScore: req.body.middleScore,
    minScore: req.body.minScore,
  });
  res.status(201).json({
    message: "Category successfully uploaded",
    status: "success",
    data: category,
  });
});

// * Fetch categories
exports.getCategory = catchAsync(async (req, res, next) => {
  const id = req.params?.id;
  const category = id
    ? await Category.find({ _id: id })
    : await Category.find();
  res.status(200).json({
    status: "success",
    message: "Categories successfully fetched",
    data: category,
  });
});

// * Delete category
exports.deleteCategory = catchAsync(async (req, res, next) => {
  await Category.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Category successfully deleted",
  });
});

// * Get all events in category
exports.getAllEvents = catchAsync(async (req, res, next) => {
  const event = await Category.findOne({ name: req.params.name }).populate({
    path: "events",
  });
  res.status(200).json({
    status: "success",
    message: "Events successfully fetched",
    data: event,
  });
});
