const express = require("express");
const router = express.Router();
const Controller = require("./controller");

router
  .route('/adminlogin').post(Controller.adminlogin);

  router
  .route('/userlogin').post(Controller.userLogin);

router
  .route('/createnewaccess').post(Controller.createNewAccessToken);

router
  .route('/googlelogin').post(Controller.firebaseLogin);

module.exports = router;
