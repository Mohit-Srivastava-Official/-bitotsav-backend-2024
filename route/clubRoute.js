const { Router } = require("express");

const clubController = require("../controller/clubController");

const router = Router();

router
  .route("/signup")
  .post(clubController.forceAuthState(false), clubController.signUp);

router
  .route("/signin")
  .post(clubController.forceAuthState(false), clubController.signIn);

router
  .route("/modifyClub")
  .post(clubController.forceAuthState(true), clubController.modifyClub);

router.route("/getClub/:id").get(clubController.getClub);

router
  .route("/createEvent")
  .post(
    clubController.forceAuthState(true),
    clubController.uploadcoverImage,
    clubController.resizeImage,
    clubController.createEvent
  );

router
  .route("/getEvents")
  .post(clubController.forceAuthState(true), clubController.getEvents);

router
  .route("/modifyEvent")
  .post(clubController.forceAuthState(true), clubController.modifyEvent);

router
  .route("/deleteEvent")
  .post(clubController.forceAuthState(true), clubController.deleteEvent);

router
  .route("/postScore")
  .post(clubController.forceAuthState(true), clubController.postScore);

router
  .route("/getParticipants")
  .post(clubController.forceAuthState(true), clubController.getParticipants);

router.route("/getAllClubs").get(clubController.getAllClubs);

module.exports = router;
