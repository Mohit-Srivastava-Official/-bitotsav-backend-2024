const express = require("express");
const authController = require("./../controller/authController");
const teamController = require("./../controller/teamController");
const router = express.Router();
router
  .route("/register")
  .post(authController.checkJWT, teamController.registerTeam);
router
  .route("/:eventId/participate/")
  .patch(authController.checkJWT, teamController.participateInEvent);
router.get(
  "/getAllEvents",
  authController.checkJWT,
  teamController.getAllParticipatedEvent
);
module.exports = router;
