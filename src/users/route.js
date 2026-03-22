const express = require("express");
const router = express.Router();
const Controller = require("./controller");
const { VerifyUserAuthToken } = require("../middleware/authToken");
const { singleFileUpload } = require("../middleware/multer");

// register user
router.route("/registeruser").post(Controller.registerUser);

// user profile

router.route("/getprofile").get(VerifyUserAuthToken, Controller.getProfile);
router
  .route("/updateprofile")
  .put(VerifyUserAuthToken, singleFileUpload, Controller.updateProfile);
router.route("/trackorder").get(VerifyUserAuthToken, Controller.trackOrder);
// User Address
router.route("/addaddress").post(VerifyUserAuthToken, Controller.addAddress);
router.route("/getaddress").get(VerifyUserAuthToken, Controller.getAddress);
router
  .route("/updateaddress/:id")
  .put(VerifyUserAuthToken, Controller.updateAddress);
router
  .route("/deleteaddress/:id")
  .delete(VerifyUserAuthToken, Controller.deleteAddress);

// get in touch
router.route("/getintouch").post(VerifyUserAuthToken,Controller.getInTouch);

// enquiry
router.route("/createenquiry").post(Controller.userEnquiry);

// Cart
router.route("/addtocart").post(VerifyUserAuthToken, Controller.addToCart);
router.route("/getcart").get(VerifyUserAuthToken, Controller.getCart);
router.route("/editcart").put(VerifyUserAuthToken, Controller.editCart);
router
  .route("/deletecart/:id")
  .delete(VerifyUserAuthToken, Controller.deleteCart);

router.route("/addtocart").post(VerifyUserAuthToken, Controller.addToCart);
router.get("/checkout", VerifyUserAuthToken, Controller.checkout);
router
  .route("/addresstocart")
  .post(VerifyUserAuthToken, Controller.addAddressToCart);
router.route("/getcart").get(VerifyUserAuthToken, Controller.getCart);
router.route("/editcart").put(VerifyUserAuthToken, Controller.editCart);
router.route("/deletecart/:id").put(VerifyUserAuthToken, Controller.deleteCart);

// wishlist
router
  .route("/addtowishlist")
  .post(VerifyUserAuthToken, Controller.addToWishlist);
router.route("/getwishlist").get(VerifyUserAuthToken, Controller.getWishlist);
// router.route('/editwishlist').put(VerifyUserAuthToken,Controller.editToWishlist);
router
  .route("/deletewishlist/:id")
  .delete(VerifyUserAuthToken, Controller.removeToWishlist);
router
  .route("/deletewishlist/:id")
  .put(VerifyUserAuthToken, Controller.removeToWishlist);

router.route("/home").get(Controller.homeServices);
router.route("/search").get(Controller.searchService);
router.route("/newArrivals").get(Controller.newArrivals);

// rating and reviews

router
  .route("/addreview/:productId/:variantId")
  .post(VerifyUserAuthToken, singleFileUpload, Controller.addReview);
router
  .route("/getuserreview")
  .get(VerifyUserAuthToken, Controller.getUserReview);

module.exports = router;
