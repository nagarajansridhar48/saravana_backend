const express = require("express");
const router = express.Router();
const {VerifyAdminAuthToken} = require("../middleware/authToken");
const Controller = require('./controller');
const { singleFileUpload } = require("../middleware/multer");

router
  .route('/subcategories')
  .post(
    VerifyAdminAuthToken,
    singleFileUpload,
    Controller.create_SubCategories
  );

router
  .route('/getallsubcategories')
  .get(
    VerifyAdminAuthToken,
    Controller.get_AllSubCategories
  );

router
  .route('/getsubcategories/:id')
  .get(
    VerifyAdminAuthToken,
    Controller.get_SubCategoryById
  );

router
  .route('/updatesubcategories/:id')
  .put(
    VerifyAdminAuthToken,
    singleFileUpload,     
    Controller.update_SubCategory
  );

  router
  .route('/deletesubcategories/:id')
  .delete(
    VerifyAdminAuthToken,
    Controller.delete_SubCategory
  );


module.exports = router;