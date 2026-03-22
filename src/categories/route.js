const express = require("express");
const router = express.Router();
const Controller = require("./controller");
const { VerifyAdminAuthToken } = require("../middleware/authToken");
const { singleFileUpload } = require("../middleware/multer");

router
  .route("/createcategories")
  .post(singleFileUpload, Controller.create_Category);
router
  .route("/getallcategories")
  .get( Controller.getAllCategories);
router
  .route("/getcategory/:id")
  .get( Controller.getCategoryById);
router
  .route("/updatecategory/:id")
  .put(VerifyAdminAuthToken, singleFileUpload, Controller.updateCategory);
router
  .route("/deletecategory/:id")
  .delete(VerifyAdminAuthToken, Controller.deleteCategoryById);

module.exports = router;
