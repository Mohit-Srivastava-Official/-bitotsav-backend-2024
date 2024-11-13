const express = require("express");
const router = express.Router();
const authController = require("./../controller/authController");
const eventController = require("./../controller/eventController");
router.get("/getSchedule", eventController.getEventDayWise);

router.get("/getEventInGroup", eventController.getEventInGroup);
router.get("/getEventlist", eventController.getEventlist);
router
  .route("/")
  .post(
    authController.checkJWT,
    eventController.checkAdmin,
    eventController.uploadcoverImage,
    eventController.resizeImage,
    eventController.creatEvent
  )
  .get(eventController.getEvent);
router
  .route("/:id")
  .get(eventController.getEvent)
  .delete(
    authController.checkJWT,
    eventController.checkAdmin,
    eventController.deleteEvent
  );
router.route("/:id/getLeaderDetail").get(eventController.getAllLeaders);
router.get(
  "/:id/participants",
  // authController.checkJWT,
  // eventController.checkAdmin,
  eventController.getAllParticipants
);

module.exports = router;
