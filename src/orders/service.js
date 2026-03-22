const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const { cartModel } = require("../users/model");
const { OrderModel, PaymentModel } = require("./model");
const { ProductModel } = require("../products/model");
const { userModel } = require("../users/model");

const { generateOrderId } = require("../utils/uniqueId");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

class OrderService {
  constructor() {
    this.initializeRazorpay();
    this.SESSION_TIMEOUT_MINUTES = 30;
  }

  initializeRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_SCSRTY2WSfBFhm";
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET || "6MP5iuRqXHd1E75szGC12k0f";

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Place order - Main entry point
   */
  async placeOrder(req) {
    const userId = req.user._id;
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const { paymentMethod, isBuyNow = false } = req.body;

      // Validate payment method
      this.validatePaymentMethod(paymentMethod);

      // Get user data with addresses
      const userData = await this.getUserWithAddresses(userId);

      // Get cart items or buy now items
      const itemsResult = isBuyNow
        ? await this.getBuyNowItems(req.body, session)
        : await this.getCartItems(userId, session);

      // Validate stock availability
      await this.validateStockAvailability(itemsResult.cartItems, session);

      // Calculate pricing
      const pricing = this.calculatePricing({
        cartItems: itemsResult.cartItems,
        paymentMethod,
      });

      // Validate COD limit
      if (paymentMethod === "COD") {
        this.validateCODLimit(pricing.finalTotal);
      }

      // Create order
      const order = await this.createOrderTransaction(
        {
          userId,
          cartItems: itemsResult.cartItems,
          userData,
          pricing,
          paymentMethod,
          isBuyNow,
          billingAddress: userData.billingAddress,
          deliveryAddress: userData.deliveryAddress,
        },
        session,
      );

      // Process payment
      const paymentResult = await this.processPayment({
        paymentMethod,
        amount: pricing.finalTotal,
        order,
        userId,
        session,
      });

      // Update stock for COD immediately
      if (paymentMethod === "COD") {
        await this.updateStock(order, session);
      }

      // Clear cart if not buy now
      if (!isBuyNow) {
        await cartModel.findOneAndDelete({ userId }).session(session);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: "Order created successfully",
        data: {
          orderId: order.orderId,
          order,
          payment: paymentResult,
          pricingSummary: pricing,
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get order by ID (simple version)
   */
  async getOrderById(orderId, userId) {
    const order = await OrderModel.findOne({
      _id: orderId,
      userId,
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  /**
   * Get order details with product information
   */
  async getOrderDetails(orderId, userId) {
    const order = await OrderModel.findOne({
      orderId,
      userId,
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Get product details for items in order
    const productIds = order.orderDetails[0].products.map((p) => p.productId);
    const products = await ProductModel.find(
      { _id: { $in: productIds } },
      {
        productName: 1,
        images: 1,
        category: 1,
        brand: 1,
        variants: 1,
        productStatus: 1,
      },
    ).lean();

    const productMap = {};
    products.forEach((product) => {
      productMap[product._id.toString()] = product;
    });

    // Enhance order details with product info
    const enhancedOrder = {
      ...order,
      orderDetails: order.orderDetails.map((detail) => ({
        ...detail,
        products: detail.products.map((product) => {
          const productData = productMap[product.productId.toString()];
          let variantData = null;

          if (product.variantId && productData?.variants) {
            variantData = productData.variants.find(
              (v) => v._id.toString() === product.variantId,
            );
          }

          return {
            ...product,
            productDetails: productData
              ? {
                  name: productData.productName,
                  images: productData.images,
                  category: productData.category,
                  brand: productData.brand,
                  status: productData.productStatus,
                }
              : null,
            variantDetails: variantData,
          };
        }),
      })),
    };

    return enhancedOrder;
  }

  /**
   * Get user's orders with pagination
   */
  async getUserOrders(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      OrderModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-__v -metadata")
        .lean(),
      OrderModel.countDocuments({ userId }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId, userId) {
    const order = await OrderModel.findOne({
      _id: orderId,
      userId,
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return {
      orderId: order.orderId,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      orderConfirmedAt: order.orderConfirmedAt,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, userId, reason) {
    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      const order = await OrderModel.findOne({
        orderId,
        userId,
      }).session(session);

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Check if order can be cancelled
      const cancellableStatuses = ["Pending", "Ordered", "Packing"];
      if (!cancellableStatuses.includes(order.orderStatus)) {
        throw new ApiError(
          400,
          `Order cannot be cancelled in current status: ${order.orderStatus}`,
        );
      }

      // Update order status
      order.orderStatus = "Cancelled";
      order.reason = reason;
      await order.save({ session });

      // Restore stock
      await this.restoreStock(order, session);

      // Initiate refund if payment was completed
      if (order.paymentStatus === "Completed") {
        await this.initiateRefund(order, session);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(req) {
    const userId = req.user._id;

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      console.log("response", req);
      console.log("🔍 Verifying Razorpay payment:", {
        razorpay_order_id,
        razorpay_payment_id,
        userId,
      });

    const session = await mongoose.startSession();

    try {
      await session.startTransaction();

      // Verify signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      console.log("generatedSi", generatedSignature);

      if (generatedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature");
      }

      // Fetch payment status from Razorpay
      const { items = [] } =
        await this.razorpay.orders.fetchPayments(razorpay_order_id);
      const paymentItem = items[0];

      if (!paymentItem || paymentItem.status !== "captured") {
        throw new ApiError(400, "Payment not captured");
      }

      // Find payment record by razorpayOrderId
      const paymentRecord = await PaymentModel.findOne({
        razorpayOrderId: razorpay_order_id,
      }).session(session);

      if (!paymentRecord) {
        throw new ApiError(404, "Payment record not found");
      }

      // Find and update order using the orderId from payment record
      const order = await OrderModel.findById(paymentRecord.orderId).session(
        session,
      );

      if (!order) {
        throw new ApiError(404, "Order not found");
      }

      // Verify amount matches
      const paymentAmount = paymentItem.amount / 100;
      if (Math.abs(paymentAmount - paymentRecord.amount) > 0.01) {
        throw new ApiError(400, "Payment amount mismatch");
      }

      // Update payment record
      const updatedPayment = await PaymentModel.findByIdAndUpdate(
        paymentRecord._id,
        {
          razorpayPaymentId: razorpay_payment_id,
          paymentStatus: "paid",
          pendingPaymentExpiry: null,
          verifiedAt: new Date(),
          securityChecks: {
            signatureVerified: true,
            amountVerified: true,
            expiryVerified: true,
            captureVerified: true,
          },
        },
        { new: true, session },
      );

      // Update order status
      order.orderStatus = "Ordered";
      order.paymentStatus = "Completed";
      order.expiresAt = null;
      order.orderConfirmedAt = new Date();
      await order.save({ session });

      // Update stock
      await this.updateStock(order, session);

      // Clear cart if not buy now
      if (!order.isBuyNow) {
        await cartModel.findOneAndDelete({ userId }).session(session);
      }

      await session.commitTransaction();

      return {
        success: true,
        message: "Payment verified successfully",
        data: {
          payment: updatedPayment,
          order,
          orderId: order.orderId, // Include orderId for frontend
        },
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Verify Stripe payment (placeholder)
   */
  async verifyStripePayment(sessionId) {
    // Implement Stripe verification logic here
    return {
      sessionId,
      verified: true,
      timestamp: new Date(),
    };
  }

  /**
   * Update order status (Admin)
   */
  async updateOrderStatus(orderId, status, notes, adminId) {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    order.orderStatus = status;
    if (notes) {
      order.adminNotes = notes;
    }
    order.updatedBy = adminId;
    order.updatedAt = new Date();

    await order.save();

    return {
      orderId: order.orderId,
      status: order.orderStatus,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Get all orders (Admin)
   */
  async getAllOrders(filters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const query = {};

    // Apply filters
    if (filters.status) {
      query.orderStatus = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email firstName lastName phone")
        .lean(),
      OrderModel.countDocuments(query),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // Helper methods (from previous implementation)
  validatePaymentMethod(paymentMethod) {
    const validMethods = ["COD", "RazorPay"];
    if (!validMethods.includes(paymentMethod)) {
      throw new ApiError(400, "Invalid payment method");
    }
  }

  validateCODLimit(amount) {
    if (amount >= 5000) {
      throw new ApiError(400, "COD only available for orders below ₹5000");
    }
  }

  async getCartItems(userId, session) {
    // Implementation from previous code
    const cart = await cartModel.findOne({ userId }).session(session);

    if (!cart || !cart.items.length) {
      throw new ApiError(400, "Cart is empty");
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await ProductModel.find({
      _id: { $in: productIds },
    }).session(session);

    const cartItems = [];
    const errors = [];

    for (const item of cart.items) {
      const product = products.find((p) => p._id.toString() === item.productId);

      if (!product) {
        errors.push(`Product ${item.productId} not found`);
        continue;
      }

      if (product.productStatus !== "active") {
        errors.push(`Product ${product.productName} is not available`);
        continue;
      }

      let variant = null;
      let price = 0;
      let stockCount = 0;

      if (item.productType === "variant" && item.variantId) {
        variant = product.variants.find(
          (v) => v._id.toString() === item.variantId,
        );

        if (!variant) {
          errors.push(`Variant ${item.variantId} not found`);
          continue;
        }

        price = variant.salePrice;
        stockCount = variant.stockCount;
      } else {
        price = product.salePrice;
        stockCount = product.stockCount;
      }

      if (stockCount < item.quantity) {
        errors.push(`Insufficient stock for ${product.productName}`);
        continue;
      }

      const subtotal = price * item.quantity;

      cartItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        productType: item.productType,
        quantity: Number(item.quantity),
        price,
        subtotal,
        productName: product.productName,
        productImage: product.images?.[0] || null,
      });
    }

    if (errors.length > 0) {
      throw new ApiError(400, `Cart validation failed: ${errors.join(", ")}`);
    }

    if (cartItems.length === 0) {
      throw new ApiError(400, "No valid items in cart");
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      cartItems,
      totalAmount,
      productsId: productIds,
    };
  }

  async getBuyNowItems(orderData, session) {
    // Implementation from previous code
    const {
      productId,
      variantId,
      quantity = 1,
      productType = "nonVariant",
    } = orderData;

    const product = await ProductModel.findById(productId).session(session);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.productStatus !== "active") {
      throw new ApiError(400, "Product is not available");
    }

    let variant = null;
    let price = 0;
    let stockCount = 0;

    if (productType === "variant") {
      variant = product.variants.find((v) => v._id.toString() === variantId);

      if (!variant) {
        throw new ApiError(404, "Variant not found");
      }

      price = variant.salePrice;
      stockCount = variant.stockCount;
    } else {
      price = product.salePrice;
      stockCount = product.stockCount;
    }

    if (stockCount < quantity) {
      throw new ApiError(400, `Insufficient stock. Available: ${stockCount}`);
    }

    const subtotal = price * quantity;

    const cartItem = {
      productId,
      variantId: variantId || null,
      productType,
      quantity: Number(quantity),
      price,
      subtotal,
      productName: product.productName,
      productImage: product.images?.[0] || null,
    };

    return {
      cartItems: [cartItem],
      totalAmount: subtotal,
      productsId: [productId],
    };
  }

  calculatePricing({ cartItems, paymentMethod }) {
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (item.price || 0) * item.quantity;
    }, 0);

    const shipping = 99;
    const finalTotal = subtotal + shipping;

    return {
      subtotal: this.roundToTwo(subtotal),
      shipping: this.roundToTwo(shipping),
      finalTotal: this.roundToTwo(finalTotal),
      paymentMethod,
      isCOD: paymentMethod === "COD",
    };
  }

  roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  async validateStockAvailability(cartItems, session) {
    for (const item of cartItems) {
      const product = await ProductModel.findById(item.productId).session(
        session,
      );

      if (!product) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }

      let stockCount = 0;

      if (item.productType === "variant" && item.variantId) {
        const variant = product.variants.find(
          (v) => v._id.toString() === item.variantId,
        );

        if (!variant) {
          throw new ApiError(404, `Variant ${item.variantId} not found`);
        }

        stockCount = variant.stockCount;
      } else {
        stockCount = product.stockCount;
      }

      if (stockCount < item.quantity) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.productName}. Available: ${stockCount}`,
        );
      }
    }
  }

  async createOrderTransaction(orderData, session) {
    const {
      userId,
      cartItems,
      userData,
      pricing,
      paymentMethod,
      isBuyNow,
      billingAddress,
      deliveryAddress,
    } = orderData;

    const orderId = await generateOrderId();

    const expiresAt = new Date(
      Date.now() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000,
    );

    const orderPayload = {
      orderId,
      userId,
      email: userData.email,
      userName: userData.fullName,
      contactNumber: userData.phone,
      isBuyNow,
      orderDetails: [
        {
          products: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productType: item.productType,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            productName: item.productName,
            productImage: item.productImage,
            orderStatus: "Pending",
            paymentStatus: "Pending",
          })),
          cartQuantity: cartItems.length,
          price: pricing.finalTotal,
          finalAmount: pricing.finalTotal,
        },
      ],
      totalPrice: pricing.finalTotal,
      orderStatus: paymentMethod === "COD" ? "Ordered" : "Pending",
      paymentStatus: "Pending",
      paymentMethod,
      deliveryAddress,
      billingAddress,
      expiresAt: paymentMethod === "COD" ? null : expiresAt,
      metadata: {
        version: "1.0",
        source: isBuyNow ? "buy_now" : "cart",
        isCOD: pricing.isCOD,
        pricingBreakdown: pricing,
      },
    };

    const [order] = await OrderModel.create([orderPayload], { session });
    return order;
  }

  async processPayment({ paymentMethod, amount, order, userId, session }) {
    const paymentData = {
      userId,
      orderId: order._id,
      amount,
      paymentMethod,
      paymentStatus: "initiated",
      pendingPaymentExpiry: new Date(
        Date.now() + this.SESSION_TIMEOUT_MINUTES * 60 * 1000,
      ),
    };

    switch (paymentMethod) {
      case "RazorPay":
        order.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await order.save({ session });

        const receiptId = `REC_${Date.now()}`;

        try {
          const razorpayOrder = await this.razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: receiptId,
            notes: {
              orderId: order._id.toString(),
              userId: userId.toString(),
            },
          });

          paymentData.razorpayOrderId = razorpayOrder.id;
          const [payment] = await PaymentModel.create([paymentData], {
            session,
          });

          return {
            type: "razorpay",
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            key: process.env.RAZORPAY_KEY_ID || "rzp_test_SCSRTY2WSfBFhm",
            name: "Your Store",
            description: `Order ${order.orderId}`,
            prefill: {
              name: order.userName,
              email: order.email,
              contact: order.contactNumber,
            },
            theme: {
              color: "#A56E74",
            },
            paymentId: payment._id,
          };
        } catch (razorpayError) {
          throw new ApiError(
            400,
            `Razorpay order creation failed: ${razorpayError.message}`,
          );
        }

      case "COD":
        await OrderModel.findByIdAndUpdate(
          order._id,
          {
            orderStatus: "Ordered",
            paymentStatus: "Pending",
            expiresAt: null,
            orderConfirmedAt: new Date(),
          },
          { session },
        );

        paymentData.paymentStatus = "pending";
        paymentData.pendingPaymentExpiry = null;
        await PaymentModel.create([paymentData], { session });

        return {
          type: "cod",
          message: "COD Order Confirmed",
          requiresPayment: false,
        };

      default:
        throw new ApiError(400, "Unsupported payment method");
    }
  }

  async updateStock(order, session = null) {
    const updatePromises = [];

    for (const item of order.orderDetails[0].products) {
      const updateOptions =
        item.productType === "variant" && item.variantId
          ? {
              $inc: {
                "variants.$[variant].stockCount": -item.quantity,
              },
            }
          : {
              $inc: { stockCount: -item.quantity },
            };

      const options =
        item.productType === "variant" && item.variantId
          ? {
              arrayFilters: [{ "variant._id": item.variantId }],
              session,
            }
          : { session };

      const productUpdate = ProductModel.findByIdAndUpdate(
        item.productId,
        updateOptions,
        options,
      );

      updatePromises.push(productUpdate);
    }

    await Promise.all(updatePromises);
  }

  async getUserWithAddresses(userId) {
    // Implementation from previous code
    const user = await userModel.findById(userId).lean();
    const cart = await cartModel.findOne({ userId }).lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const { billingAddressId, deliveryAddressId } = cart;

    let billingAddress = null;
    let deliveryAddress = null;

    if (billingAddressId && user.addresses) {
      const userBillingAddress = user.addresses.find(
        (addr) => addr._id.toString() === billingAddressId,
      );

      if (userBillingAddress) {
        billingAddress = this.transformAddressForOrder(
          userBillingAddress,
          "billing",
        );
      }
    }

    if (deliveryAddressId && user.addresses) {
      const userDeliveryAddress = user.addresses.find(
        (addr) => addr._id.toString() === deliveryAddressId,
      );

      if (userDeliveryAddress) {
        deliveryAddress = this.transformAddressForOrder(
          userDeliveryAddress,
          "delivery",
        );
      }
    }

    if (!billingAddress && user.addresses && user.addresses.length > 0) {
      const firstAddress = user.addresses[0];
      billingAddress = this.transformAddressForOrder(firstAddress, "billing");
    }

    if (!deliveryAddress && user.addresses && user.addresses.length > 0) {
      const firstAddress = user.addresses[0];
      deliveryAddress = this.transformAddressForOrder(firstAddress, "delivery");
    }

    if (!billingAddress) {
      throw new ApiError(400, "Billing address not found");
    }

    if (!deliveryAddress) {
      throw new ApiError(400, "Delivery address not found");
    }

    return {
      ...user,
      billingAddress,
      deliveryAddress,
    };
  }

  transformAddressForOrder(userAddress, addressType) {
    const fullName = `${userAddress.firstName || ""} ${
      userAddress.lastName || ""
    }`.trim();

    return {
      _id: userAddress._id,
      fullName: fullName || "Not Provided",
      addressLine1: userAddress.street || "Not Provided",
      phone: userAddress.phone || "Not Provided",
      street: userAddress.street || "Not Provided",
      city: userAddress.city || "Not Provided",
      zipcode: userAddress.zipcode || "000000",
      state: userAddress.state || "Not Provided",
      country: "India",
      addressType: addressType,
      checkoutAddress: `${userAddress.street}, ${userAddress.city}, ${userAddress.state} ${userAddress.zipcode}`,
      firstName: userAddress.firstName,
      lastName: userAddress.lastName,
      email: userAddress.email,
    };
  }

  async restoreStock(order, session) {
    const updatePromises = [];

    for (const item of order.orderDetails[0].products) {
      const updateOptions =
        item.productType === "variant" && item.variantId
          ? {
              $inc: {
                "variants.$[variant].stockCount": item.quantity,
              },
            }
          : {
              $inc: { stockCount: item.quantity },
            };

      const options =
        item.productType === "variant" && item.variantId
          ? {
              arrayFilters: [{ "variant._id": item.variantId }],
              session,
            }
          : { session };

      const productUpdate = ProductModel.findByIdAndUpdate(
        item.productId,
        updateOptions,
        options,
      );

      updatePromises.push(productUpdate);
    }

    await Promise.all(updatePromises);
  }

  async initiateRefund(order, session) {
    try {
      const payment = await PaymentModel.findOne({
        orderId: order._id,
      }).session(session);

      if (!payment) {
        logger.warn(`Payment record not found for order ${order.orderId}`);
        return;
      }

      if (payment.razorpayPaymentId) {
        const refund = await this.razorpay.payments.refund(
          payment.razorpayPaymentId,
          {
            amount: Math.round(payment.amount * 100),
            speed: "normal",
            notes: {
              reason: "Order cancellation",
              orderId: order.orderId,
            },
          },
        );

        payment.refundId = refund.id;
        payment.refundStatus = "initiated";
        payment.refundInitiatedAt = new Date();
        await payment.save({ session });
      }
    } catch (error) {
      logger.error(
        `Failed to initiate refund for order ${order.orderId}:`,
        error,
      );
    }
  }

  // In service.js - Update getOrderById method
  async getOrderById(orderId, userId) {
    console.log(
      `🔍 Looking for order with orderId: ${orderId} for user: ${userId}`,
    );

    // Find by orderId field, not _id
    const order = await OrderModel.findOne({
      orderId: orderId, // This is the orderId string
      userId,
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }
}

module.exports = new OrderService();
