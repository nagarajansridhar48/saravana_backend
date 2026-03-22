const { body, param } = require("express-validator");

const validateOrder = [
  body("paymentMethod")
    .isIn([
      "COD",
      "RazorPay",
      "Stripe",
      "PayPal",
      "Google Pay",
      "Phone Pay",
      "Paytm",
    ])
    .withMessage("Invalid payment method"),

  body("billingAddressId")
    .optional()
    .isString()
    .withMessage("Billing address ID must be a string"),

  body("deliveryAddressId")
    .optional()
    .isString()
    .withMessage("Delivery address ID must be a string"),

  body("isBuyNow")
    .optional()
    .isBoolean()
    .withMessage("isBuyNow must be a boolean"),

  // For buy now orders
  body("items")
    .if(body("isBuyNow").equals(true))
    .isArray()
    .withMessage("Items must be an array for buy now orders"),

  body("items.*.productId")
    .if(body("isBuyNow").equals(true))
    .isString()
    .withMessage("Product ID is required"),

  body("items.*.quantity")
    .if(body("isBuyNow").equals(true))
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("items.*.productType")
    .if(body("isBuyNow").equals(true))
    .isIn(["variant", "nonVariant"])
    .withMessage("Invalid product type"),

  body("items.*.selectedOptionId")
    .optional()
    .isString()
    .withMessage("Selected option ID must be a string"),
];

const validateOrderStatus = [
  param("orderId").isString().notEmpty().withMessage("Order ID is required"),
  body("status")
    .isIn(["Packing", "Shipped", "Delivered"])
    .withMessage("Invalid status value"),
];

module.exports = {
  validateOrder,
  validateOrderStatus,
};
