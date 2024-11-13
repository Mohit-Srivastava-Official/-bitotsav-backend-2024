const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const userController = require("../controller/userController");
const qrcode = require("./../utils/qrcode");
router.post(
  "/signup",
  userController.DoesUserExist,
  userController.signupcreate
);
router.post(
  "/signup/:token",
  authController.signupVerify,
  userController.getLoginToken
);
router.post("/login", authController.protect, userController.login);
router.post("/getQR", authController.checkJWT, qrcode.generateQR, qrcode.getQR);
router.post(
  "/verifyEntry/:id",
  authController.checkJWT,
  qrcode.checkAdmin,
  qrcode.verifyEntry
);
router.get(
  "/getuserdetail",
  authController.checkJWT,
  userController.getUserDetail
);
router.post("/resetPassword", userController.resetPassword);
router.post(
  "/passwordresetOTPVerify/:token",
  userController.PasswordresetOTPVerify
);
module.exports = router;
