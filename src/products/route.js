const express = require("express");
const router = express.Router();
const Controller = require("./controller");
const {dynamicUpload} = require("../middleware/multer");
// const { VerifyAdminAuthToken } = require("../middleware/authToken");
router.post("/createproduct", dynamicUpload, Controller.createProduct);
router.get("/getproducts", Controller.getAllProducts);
router.get("/getProduct/:_id", Controller.getProductById);
router.put("/updateproduct/:_id", dynamicUpload, Controller.updatedProduct);
router.delete("/deleteproduct/:_id", dynamicUpload, Controller.deleteProduct);

// product details
router.get('/getproductdetails/:id',Controller.getProductDetails);


// exports
module.exports = router;
