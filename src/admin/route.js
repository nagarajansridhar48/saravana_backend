const express = require("express");
const router = express.Router();
const Controller = require("./controller");
const { VerifyAdminAuthToken } = require("../middleware/authToken");

router.route("/createadmin").post(Controller.adminRegister);
router.route('/getadmin').get(Controller.fetchAdmin);
router.route('/updateadminprofile').put(VerifyAdminAuthToken, Controller.updateAdmin);
router.route('/changeuserstatus').put(VerifyAdminAuthToken,Controller.changeStatus);
router.route('/getalluser').get(VerifyAdminAuthToken,Controller.getUsers);
router.route('/getmessage').get(VerifyAdminAuthToken,Controller.getMessages);
router.route('/deletemessage/:id').delete(VerifyAdminAuthToken,Controller.deleteMessage);
router.route('/getenquiry').get(VerifyAdminAuthToken,Controller.getEnquiries);
router.route('/getenquirybyid/:id').get(VerifyAdminAuthToken,Controller.getEnquiryById);
router.route('/deleteenquiry/:id').delete(VerifyAdminAuthToken,Controller.deleteEnquiry);


// reviews

router.route('/getalluserreview').get(VerifyAdminAuthToken,Controller.getAllReview);
router.route('/deletereview/:reviewId').delete(VerifyAdminAuthToken,Controller.removeReview);

module.exports = router;