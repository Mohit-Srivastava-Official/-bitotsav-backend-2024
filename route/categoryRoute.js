const express = require("express");
const router = express.Router();
const categoryController = require("./../controller/categoryController");
const authController = require("./../controller/authController");

router
  .route("/")
  .post(
    authController.checkJWT,
    categoryController.checkAdmin,
    categoryController.uploadcoverImage,
    categoryController.resizeImage,
    categoryController.createCategory
  )
  .get(categoryController.getCategory);
router
  .route("/:id")
  .get(categoryController.getCategory)
  .delete(
    authController.checkJWT,
    categoryController.checkAdmin,
    categoryController.deleteCategory
  );
router.get("/:name/getAllEvents", categoryController.getAllEvents);

module.exports = router;
