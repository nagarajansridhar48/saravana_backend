const mongoose = require("mongoose");
const createSchema = require("../persistence/createSchema");
const { orderSchemaFields, paymentSchemaFields } = require("./payload");

// Order Model
const orderSchema = createSchema(orderSchemaFields, {
  timestamps: true,
  collection: "orders",
});

// Add indexes for Order schema
orderSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      orderStatus: "Pending",
      expiresAt: { $exists: true },
    },
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, orderStatus: 1 });

const OrderModel = mongoose.model("orders", orderSchema);

// Payment Model
const paymentSchema = createSchema(paymentSchemaFields, {
  collection: "payments",
  timestamps: true,
});

// Add indexes for Payment schema
paymentSchema.index(
  { pendingPaymentExpiry: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      paymentStatus: { $in: ["initiated", "pending"] },
      pendingPaymentExpiry: { $exists: true, $ne: null },
    },
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 }, { unique: true });

// Pre-save middleware for Payment
paymentSchema.pre("save", function (next) {
  if (this.paymentStatus === "paid" && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
  next();
});

const PaymentModel = mongoose.model("Payment", paymentSchema);

module.exports = {
  OrderModel,
  PaymentModel,
};
