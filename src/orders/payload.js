const { v4 } = require("uuid");
const { SchemaFieldBuilder } = require("../validation/schemaFieldBuild");

// Address Schema Fields
const addressSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  fullName: new SchemaFieldBuilder(String).required().build(),
  addressLine1: new SchemaFieldBuilder(String).required().build(),
  phone: new SchemaFieldBuilder(String).required().build(),
  street: new SchemaFieldBuilder(String).required().build(),
  city: new SchemaFieldBuilder(String).required().build(),
  zipcode: new SchemaFieldBuilder(String).required().build(),
  state: new SchemaFieldBuilder(String).required().build(),
  country: new SchemaFieldBuilder(String).required().build(),
  addressType: new SchemaFieldBuilder(String).required().build(),
  checkoutAddress: new SchemaFieldBuilder(String).required().build(),
};

// Order Product Schema Fields
const orderProductSchemaFields = {
  productId: new SchemaFieldBuilder(String).required().build(),
  variantId: new SchemaFieldBuilder(String).build(),
  productType: new SchemaFieldBuilder(String)
    .enum(["variant", "nonVariant"])
    .required()
    .build(),
  quantity: new SchemaFieldBuilder(Number).required().min(1).build(),
  price: new SchemaFieldBuilder(Number).required().min(0).build(),
  customization: {
    optionName: new SchemaFieldBuilder(String).build(),
    selectedLabel: new SchemaFieldBuilder(String).build(),
    selectedPrice: new SchemaFieldBuilder(Number).build(),
    valueId: new SchemaFieldBuilder(String).build(),
  },
  customizationCost: new SchemaFieldBuilder(Number).default(0).build(),
  subtotal: new SchemaFieldBuilder(Number).required().build(),
  orderStatus: new SchemaFieldBuilder(String)
    .enum([
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
    .default("Pending")
    .build(),
  paymentStatus: new SchemaFieldBuilder(String)
    .enum(["Pending", "Completed", "Refunded", "Failed", "Partial"])
    .default("Pending")
    .build(),
  returnReason: new SchemaFieldBuilder(String).default(null).build(),
  returnImage: new SchemaFieldBuilder(String).default(null).build(),
};

// Order Detail Schema Fields
const orderDetailSchemaFields = {
  products: new SchemaFieldBuilder([orderProductSchemaFields])
    .required()
    .build(),
  cartQuantity: new SchemaFieldBuilder(Number).required().build(),
  price: new SchemaFieldBuilder(Number).required().build(),
  discount: new SchemaFieldBuilder(Number).default(0).build(),
  taxAmount: new SchemaFieldBuilder(Number).default(0).build(),
  shippingCharge: new SchemaFieldBuilder(Number).default(0).build(),
  finalAmount: new SchemaFieldBuilder(Number).required().build(),
  discountBreakdown: {
    productDiscount: new SchemaFieldBuilder(Number).default(0).build(),
    codFee: new SchemaFieldBuilder(Number).default(0).build(),
    fivePercentDiscount: {
      amount: new SchemaFieldBuilder(Number).default(0).build(),
      type: new SchemaFieldBuilder(String)
        .enum(["firstOrder", "razorpay", null])
        .build(),
      isFirstOrder: new SchemaFieldBuilder(Boolean).default(false).build(),
    },
    totalDiscounts: new SchemaFieldBuilder(Number).default(0).build(),
  },
};

// Order Schema Fields
const orderSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  orderId: new SchemaFieldBuilder(String).required().unique().build(),
  userId: new SchemaFieldBuilder(String).ref("users").required().build(),
  email: new SchemaFieldBuilder(String).build(),
  userName: new SchemaFieldBuilder(String).build(),
  contactNumber: new SchemaFieldBuilder(String).build(),
  isBuyNow: new SchemaFieldBuilder(Boolean).default(false).build(),
  orderDetails: new SchemaFieldBuilder([orderDetailSchemaFields])
    .required()
    .build(),
  totalPrice: new SchemaFieldBuilder(Number).build(),
  orderStatus: new SchemaFieldBuilder(String)
    .enum([
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
    .default("Pending")
    .build(),
  returnStatus: new SchemaFieldBuilder(String)
    .enum(["Pending", "In Process", "Approved", "Rejected", "Cancelled"])
    .default(null)
    .build(),
  paymentStatus: new SchemaFieldBuilder(String)
    .enum(["Pending", "Completed", "Refunded", "Failed", "Partial"])
    .default("Pending")
    .build(),
  paymentMethod: new SchemaFieldBuilder(String)
    .enum([
      "COD",
      "Bank Transfer",
      "RazorPay",
      "Google Pay",
      "PayPal",
      "Phone Pay",
      "Paytm",
      "Stripe",
    ])
    .required()
    .build(),
  reason: new SchemaFieldBuilder(String).default(null).build(),
  returnImage: new SchemaFieldBuilder(String).default(null).build(),
  deliveryAddress: new SchemaFieldBuilder(addressSchemaFields)
    .required()
    .build(),
  billingAddress: new SchemaFieldBuilder(addressSchemaFields)
    .required()
    .build(),
  expiresAt: new SchemaFieldBuilder(Date)
    .default(function () {
      if (this.orderStatus === "Pending") {
        return new Date(Date.now() + 30 * 60 * 1000);
      }
      return null;
    })
    .build(),
  orderPlacedAt: new SchemaFieldBuilder(Date).default(Date.now).build(),
  orderConfirmedAt: new SchemaFieldBuilder(Date).build(),
  metadata: {
    version: new SchemaFieldBuilder(String).default("1.0").build(),
    source: new SchemaFieldBuilder(String).enum(["cart", "buy_now"]).build(),
    isCOD: new SchemaFieldBuilder(Boolean).default(false).build(),
    pricingBreakdown: new SchemaFieldBuilder(Object).build(), // Using Object for Mixed type
  },
};

// Payment Schema Fields
const paymentSchemaFields = {
  _id: new SchemaFieldBuilder(String).default(v4).build(),
  userId: new SchemaFieldBuilder(String).ref("users").required().build(),
  orderId: new SchemaFieldBuilder(String).ref("orders").required().build(),
  amount: new SchemaFieldBuilder(Number).required().min(0).build(),
  pendingPaymentExpiry: new SchemaFieldBuilder(Date)
    .default(function () {
      return new Date(Date.now() + 30 * 60 * 1000);
    })
    .build(),
  paymentMethod: new SchemaFieldBuilder(String)
    .enum([
      "COD",
      "RazorPay",
      "Stripe",
      "PayPal",
      "Google Pay",
      "Phone Pay",
      "Paytm",
    ])
    .required()
    .build(),
  razorpayOrderId: new SchemaFieldBuilder(String).unique().sparse().build(),
  razorpayPaymentId: new SchemaFieldBuilder(String).sparse().build(),
  stripeSessionId: new SchemaFieldBuilder(String).unique().sparse().build(),
  stripePaymentId: new SchemaFieldBuilder(String).sparse().build(),
  paymentStatus: new SchemaFieldBuilder(String)
    .enum(["pending", "paid", "failed", "initiated", "refunded"])
    .default("initiated")
    .build(),
  verifiedAt: new SchemaFieldBuilder(Date).build(),
  securityChecks: {
    signatureVerified: new SchemaFieldBuilder(Boolean).default(false).build(),
    amountVerified: new SchemaFieldBuilder(Boolean).default(false).build(),
    expiryVerified: new SchemaFieldBuilder(Boolean).default(false).build(),
    captureVerified: new SchemaFieldBuilder(Boolean).default(false).build(),
  },
};

module.exports = {
  orderSchemaFields,
  paymentSchemaFields,
};
