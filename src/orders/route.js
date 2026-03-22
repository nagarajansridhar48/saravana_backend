const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const {
  VerifyAdminAuthToken,
  VerifyUserAuthToken,
} = require("../middleware/authToken");
const Controller = require("./controller");

// User routes
router
  .route("/")
  .post(VerifyUserAuthToken, Controller.createOrder)
  .get(
    VerifyUserAuthToken,
    [
      query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
      query("limit")
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage("Limit must be between 1 and 50"),
    ],
    Controller.getUserOrders,
  );

router
  .route("/:orderId")
  .get(
    VerifyUserAuthToken,
    [param("orderId").isMongoId().withMessage("Invalid order ID")],
    Controller.getOrderById,
  );

router.get(
  "/:orderId/details",
  VerifyUserAuthToken,
  [param("orderId").isMongoId().withMessage("Invalid order ID")],
  Controller.getOrderDetails,
);

router.get(
  "/:orderId/status",
  VerifyUserAuthToken,
  [param("orderId").isMongoId().withMessage("Invalid order ID")],
  Controller.getOrderStatus,
);

router.post(
  "/:orderId/cancel",
  VerifyUserAuthToken,
  [
    param("orderId").isMongoId().withMessage("Invalid order ID"),
    body("reason").notEmpty().withMessage("Reason is required"),
  ],
  Controller.cancelOrder,
);

// Payment verification
router.post("/verify", VerifyUserAuthToken, Controller.verifyRazorpayPayment);

// Your router is correct - uses :orderId
router.route("/:orderId").get(VerifyUserAuthToken, Controller.getOrderById);

router.post(
  "/payment/stripe/verify",
  VerifyUserAuthToken,
  Controller.verifyStripePayment,
);

// Admin routes
router.get(
  "/admin/all",
  VerifyAdminAuthToken,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),
    query("status")
      .optional()
      .isString()
      .withMessage("Status must be a string"),
    query("startDate")
      .optional()
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    query("endDate")
      .optional()
      .isISO8601()
      .withMessage("End date must be a valid date"),
  ],
  Controller.getAllOrders,
);

router.put(
  "/admin/:orderId/status",
  VerifyAdminAuthToken,
  [
    param("orderId").isMongoId().withMessage("Invalid order ID"),
    body("status")
      .isIn([
        "Pending",
        "Ordered",
        "Packing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Return Request",
        "Returned",
        "Partial",
      ])
      .withMessage("Invalid order status"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
  ],
  Controller.updateOrderStatus,
);

module.exports = router;
