const Order = require("../models/Order.js");
const Product = require("../models/Product.js");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail.js");
const generateInvoice = require("../utils/generateInvoice.js");
const exportOrders = require("../utils/exportOrders");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

const addOrderItems = async (req, res) => {
  const { items, totalAmount, address, paymentId, couponCode } = req.body;
  const deductedItems = [];

  try {
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    // Atomic stock check and deduction loop with server-authoritative pricing
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );

      if (!product) {
        // Rollback previously deducted items
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }

        const prod = await Product.findById(item.productId);
        return res.status(400).json({
          message: `${prod ? prod.name : "Product"} has insufficient stock or does not exist`,
        });
      }

      // Enforce authoritative database pricing to prevent client price tampering
      item.price = product.price;
      item.productName = product.name;
      item.productImage = product.imageUrl;

      deductedItems.push({ productId: item.productId, qty: item.qty });
    }

    // OTP Verification for COD
    if ((req.body.paymentMethod || "COD") === "COD") {
      const user = await User.findById(req.user._id);

      if (!user.emailVerified) {
        // Rollback stocks since validation failed!
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }
        return res.status(400).json({
          success: false,
          message: "Please verify your email before placing COD order",
        });
      }
    }

    // Recalculate and verify pricing + coupons
    const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (calculatedSubtotal <= 0) {
      // Rollback stocks since validation failed!
      for (const rolledBackItem of deductedItems) {
        await Product.findByIdAndUpdate(rolledBackItem.productId, {
          $inc: { stock: rolledBackItem.qty },
        });
      }
      return res.status(400).json({ message: "Cart total cannot be ₹0" });
    }

    let calculatedDiscount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const Coupon = require("../models/Coupon");
      const { checkCouponValidity, calculateCouponDiscount } = require("./couponController");

      appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!appliedCoupon) {
        // Rollback stocks since validation failed!
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      const validation = await checkCouponValidity(appliedCoupon, items, req.user._id);
      if (!validation.valid) {
        // Rollback stocks since validation failed!
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }
        return res.status(400).json({ message: validation.message });
      }

      calculatedDiscount = calculateCouponDiscount(appliedCoupon, items);
    }

    // ---------------------------------------------------------
    // SECURITY REWARD WALLET BALANCES AND COINS VALIDATION
    // ---------------------------------------------------------
    const requestCoinsUsed = Number(req.body.coinsUsed) || 0;
    const userProfile = await User.findById(req.user._id);
    
    if (requestCoinsUsed > 0) {
      if (userProfile.isWalletFrozen) {
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, { $inc: { stock: rolledBackItem.qty } });
        }
        return res.status(400).json({ message: "Your rewards wallet is currently frozen" });
      }
      if (userProfile.walletBalance < requestCoinsUsed) {
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, { $inc: { stock: rolledBackItem.qty } });
        }
        return res.status(400).json({ message: "Insufficient VENUS Coins balance" });
      }
    }

    // ---------------------------------------------------------
    // AUTHORITATIVE FEES & TOTAL CALCULATION
    // ---------------------------------------------------------
    const paymentMethod = req.body.paymentMethod || "COD";
    const isCOD = paymentMethod === "COD";
    const authoritativeCodFee = isCOD ? 50 : 0;
    const authoritativeShippingCharge = 0; // Standard Free Shipping

    // Calculate maximum allowable coin discount (cannot exceed subtotal after coupon discount)
    const postCouponSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);
    const validCoinsDiscount = Math.min(postCouponSubtotal, requestCoinsUsed);

    const calculatedTotal = parseFloat(
      Math.max(0, postCouponSubtotal - validCoinsDiscount + authoritativeCodFee + authoritativeShippingCharge).toFixed(2)
    );

    // Verify against request tampering
    if (Math.abs(calculatedTotal - Number(totalAmount)) > 0.05) {
      // Rollback stocks since validation failed!
      for (const rolledBackItem of deductedItems) {
        await Product.findByIdAndUpdate(rolledBackItem.productId, {
          $inc: { stock: rolledBackItem.qty },
        });
      }
      return res.status(400).json({ message: "Price verification mismatch" });
    }

    const order = new Order({
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: address.phone,
      items: items.map((item) => ({
        productId: item.productId || item._id,
        productName: item.productName || item.name,
        productImage: item.productImage || item.imageUrl,
        qty: item.qty,
        price: item.price,
      })),
      subtotal: calculatedSubtotal,
      discountAmount: calculatedDiscount,
      couponCode: couponCode ? couponCode.toUpperCase() : "",
      coinsUsed: validCoinsDiscount,
      shippingCharge: authoritativeCodFee + authoritativeShippingCharge,
      taxAmount: 0,
      totalAmount: calculatedTotal,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      paymentMethod: req.body.paymentMethod || "COD",
      paymentId,
      otpVerified: (req.body.paymentMethod || "COD") === "COD",
      paymentStatus: "Pending",
      status: "Pending",
      orderTimeline: [
        {
          status: "Pending",
          timestamp: new Date(),
          updatedBy: "System",
        },
      ],
      isGift: req.body.isGift || false,
      giftWrap: req.body.giftWrap || false,
      giftBox: req.body.giftBox || false,
      giftMessage: req.body.giftMessage || "",
      giftReceipt: req.body.giftReceipt || false,
    });

    // Save order
    const createdOrder = await order.save();

    // Deduct coins immediately when order is placed
    if (requestCoinsUsed > 0) {
      userProfile.walletBalance = Math.max(0, userProfile.walletBalance - requestCoinsUsed);
      userProfile.totalRedeemed += requestCoinsUsed;
      userProfile.rewardTransactions.push({
        transactionType: "Used",
        coins: requestCoinsUsed,
        orderId: createdOrder._id.toString(),
        description: `Coins redeemed at checkout VC${createdOrder._id.toString().slice(-6).toUpperCase()}`,
        createdAt: new Date()
      });
      await userProfile.save();
    }

    // Increment coupon usage
    if (appliedCoupon) {
      appliedCoupon.totalUsage += 1;
      await appliedCoupon.save();
    }

    // Send confirmation email asynchronously (non-blocking)
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(createdOrder, "Pending").catch((err) => {
      console.error("❌ Order Placed email notification failed:", err.message);
    });

    // Send response
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    // Rollback stocks on any general server/db error during saving
    for (const rolledBackItem of deductedItems) {
      await Product.findByIdAndUpdate(rolledBackItem.productId, {
        $inc: { stock: rolledBackItem.qty },
      });
    }
    res.status(500).json({
      message: "Server Error",
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name email")
      .populate("items.productId", "category imageUrl")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Admin

const validStatuses = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out For Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
  "Return Requested",
  "Return Approved",
  "Refund Completed",
  "Cancellation Requested"
];

const updateOrderStatus = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      tags, 
      adminNote, 
      courier, 
      trackingNumber, 
      expectedDeliveryDate, 
      dispatchDate, 
      shippingCost 
    } = req.body;

    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updateData = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status "${status}". Allowed values: ${validStatuses.join(", ")}`,
        });
      }
      updateData.status = status;

      if (oldOrder.status !== status) {
        updateData.$push = {
          orderTimeline: {
            status,
            timestamp: new Date(),
            updatedBy: req.user ? req.user.name : "Admin",
          }
        };

        if (status === "Delivered") {
          updateData.deliveredAt = new Date();
          updateData.returnAllowedTill = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          );
          updateData.reviewEligible = true;

          // Reward 5% of subtotal as VENUS Coins after Delivered
          const coinsToEarn = Math.floor(oldOrder.subtotal * 0.05);
          if (coinsToEarn > 0) {
            const customer = await User.findById(oldOrder.userId);
            if (customer && !customer.isWalletFrozen) {
              customer.walletBalance += coinsToEarn;
              customer.totalEarned += coinsToEarn;
              customer.rewardTransactions.push({
                transactionType: "Earned",
                coins: coinsToEarn,
                orderId: oldOrder._id.toString(),
                description: `5% cashback for order VC${oldOrder._id.toString().slice(-6).toUpperCase()}`,
                createdAt: new Date()
              });
              await customer.save();
            }
          }
        }

        if (status === "Cancelled" && oldOrder.status !== "Cancelled" && oldOrder.status !== "Returned" && oldOrder.status !== "Return Approved") {
          for (const item of oldOrder.items) {
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.qty },
              });
            }
          }

          // Refund coins automatically if used
          if (oldOrder.coinsUsed > 0) {
            const customer = await User.findById(oldOrder.userId);
            if (customer) {
              customer.walletBalance += oldOrder.coinsUsed;
              customer.rewardTransactions.push({
                transactionType: "Refund Reversal",
                coins: oldOrder.coinsUsed,
                orderId: oldOrder._id.toString(),
                description: `Refund reversal for cancelled order VC${oldOrder._id.toString().slice(-6).toUpperCase()}`,
                createdAt: new Date()
              });
              await customer.save();
            }
          }
        }
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    if (Array.isArray(tags)) {
      updateData.tags = tags;
    }

    if (adminNote) {
      updateData.adminNotes = adminNote;
      if (!updateData.$push) updateData.$push = {};
      updateData.$push.adminNotesLog = {
        noteText: adminNote,
        adminName: req.user ? req.user.name : "Admin",
        timestamp: new Date(),
      };
    }

    if (courier !== undefined) updateData.courier = courier;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (expectedDeliveryDate !== undefined) updateData.expectedDeliveryDate = expectedDeliveryDate;
    if (dispatchDate !== undefined) updateData.dispatchDate = dispatchDate;
    if (shippingCost !== undefined) updateData.shippingCost = Number(shippingCost) || 0;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
    }).populate("userId", "name email");

    // Send email notification asynchronously
    if (status && oldOrder.status !== status) {
      const { sendOrderStatusNotification } = require("../utils/notificationService.js");
      sendOrderStatusNotification(order, status, oldOrder.status).catch(err => {
        console.error("❌ Notification trigger failed:", err.message);
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// BULK UPDATE ORDER STATUS
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of orderIds",
      });
    }

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const updatedOrders = [];
    const failedOrders = [];

    for (const id of orderIds) {
      try {
        const oldOrder = await Order.findById(id);
        if (!oldOrder) {
          failedOrders.push({ id, reason: "Order not found" });
          continue;
        }

        const updateData = {
          status,
          $push: {
            orderTimeline: {
              status,
              timestamp: new Date(),
              updatedBy: req.user ? req.user.name : "Admin",
            }
          }
        };

        if (status === "Delivered") {
          updateData.deliveredAt = new Date();
          updateData.returnAllowedTill = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          updateData.reviewEligible = true;
        }

        if (status === "Cancelled" && oldOrder.status !== "Cancelled" && oldOrder.status !== "Returned" && oldOrder.status !== "Return Approved") {
          for (const item of oldOrder.items) {
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
            }
          }
        }

        const order = await Order.findByIdAndUpdate(id, updateData, { returnDocument: "after" }).populate("userId", "name email");

        if (oldOrder.status !== status) {
          const { sendOrderStatusNotification } = require("../utils/notificationService.js");
          sendOrderStatusNotification(order, status, oldOrder.status).catch(err => {
            console.error("❌ Notification trigger failed:", err.message);
          });
        }

        updatedOrders.push(order._id);
      } catch (err) {
        failedOrders.push({ id, reason: err.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update complete. Updated ${updatedOrders.length} orders.`,
      updatedCount: updatedOrders.length,
      failedCount: failedOrders.length,
      updatedOrders,
      failedOrders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email")
      .populate("items.productId", "category imageUrl");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    console.log("Invoice route hit");

    const order = await Order.findById(req.params.id).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    console.log("Order found and populated:", order._id);

    await generateInvoice(order, res);
  } catch (error) {
    console.error("INVOICE ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const { cancellationReason, cancellationComments } = req.body;
    
    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    if (cancellationReason === "Other" && (!cancellationComments || cancellationComments.trim().length < 10 || cancellationComments.trim().length > 500)) {
      return res.status(400).json({
        success: false,
        message: "Please tell us why you want to cancel this order (minimum 10 characters, maximum 500).",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify ownership
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    // Check cancellation eligibility (only before Packed/Shipped)
    if (!["Pending", "Processing"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order has already been prepared/shipped and cannot be cancelled",
      });
    }

    order.status = "Cancellation Requested";
    order.cancellationReason = cancellationReason;
    order.cancellationComments = cancellationComments || "";
    order.cancelledAt = new Date();
    order.cancelledBy = "User";

    // Setup refund details dynamically
    const isPrepaid = ["Razorpay", "UPI", "Credit Card", "Debit Card"].includes(order.paymentMethod);
    if (isPrepaid) {
      order.refundStatus = "Pending";
      order.refundAmount = order.totalAmount;
      order.refundMethod = order.paymentMethod;

      // Estimate expected refund date
      const daysToAdd = order.paymentMethod === "UPI" ? 5 : (order.paymentMethod === "Razorpay" ? 5 : 7);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + daysToAdd);
      order.refundExpectedDate = expectedDate;
    } else {
      order.refundStatus = "";
      order.refundAmount = 0;
      order.refundMethod = "N/A";
    }

    order.orderTimeline.push({
      status: "Cancellation Requested",
      timestamp: new Date(),
      updatedBy: req.user.name || "Customer",
    });

    await order.save();

    // Trigger cancellation request notification email asynchronously
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Cancellation Requested").catch((err) => {
      console.error("❌ Cancellation request email notification failed:", err.message);
    });

    res.json({
      success: true,
      message: "Cancellation request submitted successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const exportOrdersExcel = async (req, res) => {
  try {
    const { search, status, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    if (search) {
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = search;
      } else {
        query.$or = [
          { customerName: { $regex: search, $options: "i" } },
          { customerEmail: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } }
        ];
      }
    }

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    await exportOrders(orders, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const resendOrderEmail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    await sendTimelineStatusEmailAsync(order, order.status);

    res.json({
      success: true,
      message: `Email notification for status "${order.status}" resent successfully!`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve Order Cancellation (Admin)
// @route   PUT /api/orders/:id/approve-cancellation
// @access  Private/Admin
const approveOrderCancellation = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Cancellation Requested") {
      return res.status(400).json({
        success: false,
        message: "Cancellation request is not active for this order",
      });
    }

    // 1. Restock items
    for (const item of order.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.qty },
        });
      }
    }

    // 2. Update status and log approvals
    order.status = "Cancelled";
    order.cancelledBy = "Admin";
    order.cancelledAt = new Date();
    
    // Refund coins automatically if used
    if (order.coinsUsed > 0) {
      const customer = await User.findById(order.userId);
      if (customer) {
        customer.walletBalance += order.coinsUsed;
        customer.rewardTransactions.push({
          transactionType: "Refund Reversal",
          coins: order.coinsUsed,
          orderId: order._id.toString(),
          description: `Refund reversal for cancelled order (Admin Approved) VC${order._id.toString().slice(-6).toUpperCase()}`,
          createdAt: new Date()
        });
        await customer.save();
      }
    }

    // Add timeline nodes
    order.orderTimeline.push({
      status: "Cancellation Approved",
      timestamp: new Date(),
      updatedBy: req.user ? req.user.name : "Admin",
    });

    const isPrepaid = ["Razorpay", "UPI", "Credit Card", "Debit Card"].includes(order.paymentMethod);
    if (isPrepaid) {
      order.refundStatus = "Initiated";
      order.orderTimeline.push({
        status: "Refund Initiated",
        timestamp: new Date(),
        updatedBy: req.user ? req.user.name : "Admin",
      });
    }

    // Log admin note
    const approveMsg = "Cancellation Request Approved by Administrator.";
    order.adminNotes = approveMsg;
    order.adminNotesLog.push({
      noteText: approveMsg,
      adminName: req.user ? req.user.name : "Admin",
      timestamp: new Date(),
    });

    await order.save();

    // Trigger emails asynchronously
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Cancellation Approved").catch((err) => {
      console.error("❌ Approval email failed:", err.message);
    });

    if (isPrepaid) {
      sendTimelineStatusEmailAsync(order, "Refund Initiated").catch((err) => {
        console.error("❌ Refund initiation email failed:", err.message);
      });
    }

    res.json({
      success: true,
      message: "Order cancellation approved successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reject Order Cancellation (Admin)
// @route   PUT /api/orders/:id/reject-cancellation
// @access  Private/Admin
const rejectOrderCancellation = async (req, res) => {
  try {
    const { refundRemarks } = req.body;
    if (!refundRemarks || refundRemarks.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Cancellation Requested") {
      return res.status(400).json({
        success: false,
        message: "Cancellation request is not active for this order",
      });
    }

    // Revert status to Processing
    order.status = "Processing";
    order.refundStatus = "";
    order.refundRemarks = refundRemarks;

    // Add timeline node
    order.orderTimeline.push({
      status: "Cancellation Rejected",
      timestamp: new Date(),
      updatedBy: req.user ? req.user.name : "Admin",
    });

    // Log admin note
    const rejectMsg = `Cancellation Request Declined. Reason: ${refundRemarks}`;
    order.adminNotes = rejectMsg;
    order.adminNotesLog.push({
      noteText: rejectMsg,
      adminName: req.user ? req.user.name : "Admin",
      timestamp: new Date(),
    });

    await order.save();

    // Send email asynchronously
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Cancellation Rejected").catch((err) => {
      console.error("❌ Rejection email failed:", err.message);
    });

    res.json({
      success: true,
      message: "Order cancellation request rejected successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update Refund Details / Mark Refunded (Admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
const updateOrderRefundDetails = async (req, res) => {
  try {
    const { refundStatus, refundTransactionId, refundRemarks } = req.body;
    
    if (!refundStatus) {
      return res.status(400).json({
        success: false,
        message: "refundStatus is required",
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.refundStatus = refundStatus;
    if (refundTransactionId) order.refundTransactionId = refundTransactionId;
    if (refundRemarks) order.refundRemarks = refundRemarks;

    if (refundStatus === "Refunded") {
      order.refundDate = new Date();
      order.paymentStatus = "Refunded";
      
      const hasCompletedNode = order.orderTimeline.some(t => t.status === "Refund Completed");
      if (!hasCompletedNode) {
        order.orderTimeline.push({
          status: "Refund Completed",
          timestamp: new Date(),
          updatedBy: req.user ? req.user.name : "Admin",
        });

        // Restore redeemed coins if order gets refunded
        if (order.coinsUsed > 0) {
          const customer = await User.findById(order.userId);
          if (customer) {
            // Check to prevent double coin refunds (if already processed during Cancelled approval)
            const alreadyRefunded = customer.rewardTransactions.some(
              t => t.orderId === order._id.toString() && t.transactionType === "Refund Reversal"
            );
            if (!alreadyRefunded) {
              customer.walletBalance += order.coinsUsed;
              customer.rewardTransactions.push({
                transactionType: "Refund Reversal",
                coins: order.coinsUsed,
                orderId: order._id.toString(),
                description: `Refund reversal for refunded order VC${order._id.toString().slice(-6).toUpperCase()}`,
                createdAt: new Date()
              });
              await customer.save();
            }
          }
        }
      }
    }

    // Log admin note
    const refundMsg = `Refund status updated to: ${refundStatus}. Remarks: ${refundRemarks || "None"}`;
    order.adminNotes = refundMsg;
    order.adminNotesLog.push({
      noteText: refundMsg,
      adminName: req.user ? req.user.name : "Admin",
      timestamp: new Date(),
    });

    await order.save();

    // Trigger Refund Completed email if status became Refunded
    if (refundStatus === "Refunded") {
      const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
      sendTimelineStatusEmailAsync(order, "Refund Completed").catch((err) => {
        console.error("❌ Refund completed email failed:", err.message);
      });
    }

    res.json({
      success: true,
      message: "Refund details updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrders,
  getMyOrderById,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getOrderById,
  downloadInvoice,
  exportOrdersExcel,
  resendOrderEmail,
  cancelMyOrder,
  deleteOrder,
  approveOrderCancellation,
  rejectOrderCancellation,
  updateOrderRefundDetails,
};
