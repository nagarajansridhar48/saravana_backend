const express = require("express");
const router = express.Router();
const { VerifyAdminAuthToken } = require("../middleware/authToken");
const Controller = require("./controller");
const { singleFileUpload, dynamicUpload } = require("../middleware/multer");

router.route("/banner").post(dynamicUpload, Controller.createBanner);
router.route("/getBanner").get(Controller.getBanner);

module.exports = router;
