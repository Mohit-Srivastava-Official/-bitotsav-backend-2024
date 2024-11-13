const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");
const leaderBoardController = require("../controller/leaderBoardController");
router.get("/", leaderBoardController.totalScore);
router.get(
  "/team",
  authController.checkJWT,
  leaderBoardController.getScoreTeam
);
router
  .route("/:eventId")
  .post(
    // use clubrouting
    authController.checkJWT,
    leaderBoardController.checkAdmin,
    leaderBoardController.postScore
  )
  .get(leaderBoardController.getScoreEventWise);

module.exports = router;
