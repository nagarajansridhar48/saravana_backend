const Service = require("./service");
const catchAsync = require("../utils/catchAsync");

/**
 * Create a new order
 */
const createOrder = catchAsync(async (req, res) => {
  const data = await Service.placeOrder(req);
  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: data.data || data,
  });
});

/**
 * Get order by ID
 */
const getOrderById = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const data = await Service.getOrderById(orderId, req.user._id);
  res.json({
    success: true,
    data,
  });
});

/**
 * Get order details with product information
 */
const getOrderDetails = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const data = await Service.getOrderDetails(orderId, req.user._id);
  res.json({
    success: true,
    data,
  });
});

/**
 * Get user's orders
 */
const getUserOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const data = await Service.getUserOrders(
    req.user._id,
    parseInt(page),
    parseInt(limit),
  );
  res.json({
    success: true,
    data,
  });
});

/**
 * Get order status
 */
const getOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const data = await Service.getOrderStatus(orderId, req.user._id);
  res.json({
    success: true,
    data,
  });
});

/**
 * Cancel order
 */
const cancelOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const data = await Service.cancelOrder(orderId, req.user._id, reason);
  res.json(data);
});

/**
 * Verify Razorpay payment
 */
const verifyRazorpayPayment = catchAsync(async (req, res) => {

  const data = await Service.verifyRazorpayPayment(req);
  res.json(data);
});

/**
 * Verify Stripe payment
 */
const verifyStripePayment = catchAsync(async (req, res) => {
  const { sessionId } = req.body;
  const data = await Service.verifyStripePayment(sessionId);
  res.json({
    success: true,
    message: "Stripe payment verified",
    data,
  });
});

/**
 * Update order status (Admin only)
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const { status, notes } = req.body;
  const data = await Service.updateOrderStatus(
    orderId,
    status,
    notes,
    req.user._id,
  );
  res.json({
    success: true,
    message: "Order status updated successfully",
    data,
  });
});

/**
 * Get all orders (Admin only)
 */
const getAllOrders = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;

  const filters = {
    status,
    startDate,
    endDate,
  };

  const data = await Service.getAllOrders(
    filters,
    parseInt(page),
    parseInt(limit),
  );
  res.json({
    success: true,
    data,
  });
});

module.exports = {
  createOrder,
  getOrderById,
  getOrderDetails,
  getUserOrders,
  getOrderStatus,
  cancelOrder,
  verifyRazorpayPayment,
  verifyStripePayment,
  updateOrderStatus,
  getAllOrders,
};
