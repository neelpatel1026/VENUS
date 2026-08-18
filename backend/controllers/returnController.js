const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");
const courierService = require("../services/courierService");
const Razorpay = require("razorpay");

const ALLOWED_CATEGORIES = [
  "Product Damaged",
  "Wrong Product Received",
  "Product Different from Description",
  "Product Quality Issue",
  "Product Arrived Opened / Leaking",
  "Product Expired",
  "Missing Item",
  "Product Does Not Meet Expectations",
  "Other",
];

// Helper to check for meaningless text
const isMeaninglessText = (text) => {
  if (!text || typeof text !== "string") return true;
  const clean = text.trim().toLowerCase();
  if (clean.length < 15) return true;

  const spamPatterns = [
    /^(no|bad|ok|don't like|dont like|na|none|not good|waste|return|n\/a|\.+|\s+)$/i,
    /^(asdf|qwerty|test|aaaa|bbbb|cccc|dddd|1234|xxxx)/i
  ];
  if (spamPatterns.some((pattern) => pattern.test(clean))) return true;

  const uniqueChars = new Set(clean.replace(/[^a-z0-9]/g, "").split(""));
  if (uniqueChars.size < 4) return true;

  return false;
};

// @desc    Get order details for return submission
// @route   GET /api/returns/order/:orderId
// @access  Private
const getOrderForReturn = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    }).select("items totalAmount subtotal discountAmount coinsUsed shippingCharge paymentMethod status deliveredAt returnAllowedTill orderTimeline customerName");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not associated with your account.",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Return requests can only be initiated for delivered orders.",
        orderStatus: order.status,
      });
    }

    const returnWindowExpired = order.returnAllowedTill && new Date() > new Date(order.returnAllowedTill);
    if (returnWindowExpired) {
      return res.status(400).json({
        success: false,
        message: "The 7-day return period for this order has expired.",
        expired: true,
      });
    }

    const existingReturn = await ReturnRequest.findOne({ orderId: order._id });
    if (existingReturn) {
      return res.status(400).json({
        success: false,
        message: "A return request has already been submitted for this order.",
        existingReturnId: existingReturn._id,
        existingStatus: existingReturn.status,
      });
    }

    res.status(200).json({
      success: true,
      order,
      allowedCategories: ALLOWED_CATEGORIES,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create new return request
// @route   POST /api/returns
// @access  Private
const createReturnRequest = async (req, res) => {
  try {
    const { orderId, reasonCategory, reason } = req.body;
    const imageUrls = [];

    // 1. Validate Order Existence and Ownership
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to access it.",
      });
    }

    // 2. Validate Delivery Status
    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders are eligible for return.",
      });
    }

    // 3. Validate Return Window
    if (order.returnAllowedTill && new Date() > new Date(order.returnAllowedTill)) {
      return res.status(400).json({
        success: false,
        message: "The 7-day return window for this order has expired.",
      });
    }

    // 4. Check for Existing Duplicate Return Request
    const existing = await ReturnRequest.findOne({ orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A return request has already been submitted for this order.",
      });
    }

    // 5. Validate Reason Category
    if (!reasonCategory || !ALLOWED_CATEGORIES.includes(reasonCategory)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid return reason category.",
      });
    }

    // 6. Validate Detailed Explanation
    if (!reason || isMeaninglessText(reason)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a meaningful explanation of the issue (minimum 15 characters).",
      });
    }

    // 7. Validate Mandatory Photos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least ONE clear photo of the received product is mandatory for verification.",
      });
    }

    // 8. Upload Proof Images to Cloudinary
    for (const file of req.files) {
      const fileStr = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const uploaded = await cloudinary.uploader.upload(fileStr, {
        folder: "venus-returns",
        resource_type: "image",
      });

      imageUrls.push(uploaded.secure_url);
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to process uploaded photos. Please select valid image files.",
      });
    }

    // 9. Calculate authoritative refundable amount
    const refundableAmount = Number(order.totalAmount) || 0;

    // 10. Create ReturnRequest Record with structured timeline
    const customerName = req.user.name || "Customer";
    const initialTimeline = [
      {
        status: "Return Requested",
        message: `Return application submitted under category '${reasonCategory}' with ${imageUrls.length} proof photos.`,
        timestamp: new Date(),
        updatedBy: customerName,
      },
    ];

    const request = await ReturnRequest.create({
      orderId,
      userId: req.user._id,
      reasonCategory,
      reason: reason.trim(),
      returnImages: imageUrls,
      status: "Return Requested",
      refundAmount: refundableAmount,
      refundMethod: req.body.refundMethod || (order.paymentMethod === "Razorpay" ? "Razorpay" : "Original Payment Method"),
      bankName: req.body.bankName || "",
      accountHolder: req.body.accountHolder || "",
      accountNumber: req.body.accountNumber || "",
      ifscCode: req.body.ifscCode || "",
      upiId: req.body.upiId || "",
      returnTimeline: initialTimeline,
    });

    // 11. Update Order Status and Timeline
    order.status = "Return Requested";
    order.orderTimeline.push({
      status: "Return Requested",
      timestamp: new Date(),
      updatedBy: customerName,
    });
    await order.save();

    // 12. Send Return Request Notification Email Asynchronously
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Return Requested").catch((err) => {
      console.error("❌ Return Requested email failed:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully. Our quality team will inspect your request within 24-48 hours.",
      request,
    });
  } catch (error) {
    console.error("🔴 Create Return Request Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process return request.",
    });
  }
};

// @desc    Get logged in user's returns with complete logistics & timeline
// @route   GET /api/returns/my
// @access  Private
const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      userId: req.user._id,
    })
      .populate({
        path: "orderId",
        select: "_id items totalAmount paymentMethod paymentStatus status createdAt deliveredAt shippingAddress",
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json(returns);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all returns (Admin) with populated details
// @route   GET /api/returns
// @access  Private/Admin
const getReturns = async (req, res) => {
  try {
    const requests = await ReturnRequest.find()
      .populate({
        path: "orderId",
        select: "_id items totalAmount paymentMethod paymentStatus status createdAt deliveredAt shippingAddress",
      })
      .populate({
        path: "userId",
        select: "name email phone",
      })
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Admin Approves Return and Creates Reverse Pickup (Idempotent)
// @route   POST /api/returns/:id/approve
// @access  Private/Admin
const approveReturnAndCreatePickup = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = await Order.findById(returnRequest.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Associated order not found" });
    }

    const adminName = req.user?.name || "Admin";

    // Idempotency: If pickup already created and return approved, return existing details
    if (returnRequest.pickupTrackingId && ["Return Approved", "Pickup Scheduled", "Picked Up", "In Transit", "Product Received"].includes(returnRequest.status)) {
      return res.status(200).json({
        success: true,
        message: "Return is already approved and reverse pickup is active.",
        returnRequest,
        isIdempotent: true,
      });
    }

    // Call Courier Service to schedule reverse pickup
    const pickupResult = await courierService.createReversePickup({
      returnRequest,
      order,
      address: order.shippingAddress,
    });

    returnRequest.status = "Pickup Scheduled";
    returnRequest.approvedAt = new Date();
    returnRequest.pickupProvider = pickupResult.provider || "Venus Express Logistics";
    returnRequest.pickupRequestId = pickupResult.pickupRequestId;
    returnRequest.pickupTrackingId = pickupResult.pickupTrackingId;
    returnRequest.pickupScheduledAt = pickupResult.pickupScheduledAt || new Date();
    returnRequest.pickupEstimatedDate = pickupResult.pickupEstimatedDate;
    returnRequest.courierTrackingUrl = pickupResult.trackingUrl;
    
    if (req.body.adminRemark) {
      returnRequest.adminRemark = req.body.adminRemark;
    }

    returnRequest.returnTimeline.push({
      status: "Pickup Scheduled",
      message: `Return approved by ${adminName}. Reverse pickup scheduled with tracking ID: ${pickupResult.pickupTrackingId}.`,
      timestamp: new Date(),
      updatedBy: adminName,
    });

    if (pickupResult.rawResponse) {
      returnRequest.courierLogs.push({
        event: "PICKUP_SCHEDULED",
        status: "SCHEDULED",
        timestamp: new Date(),
        rawData: pickupResult.rawResponse,
      });
    }

    await returnRequest.save();

    // Sync with order timeline
    order.status = "Pickup Scheduled";
    order.orderTimeline.push({
      status: "Pickup Scheduled",
      timestamp: new Date(),
      updatedBy: adminName,
    });
    await order.save();

    // Send customer notification
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Pickup Scheduled").catch((err) => {
      console.error("❌ Pickup Scheduled email failed:", err.message);
    });

    res.status(200).json({
      success: true,
      message: `Return approved! Reverse pickup scheduled with tracking ID ${pickupResult.pickupTrackingId}.`,
      returnRequest,
    });
  } catch (error) {
    console.error("🔴 Approve return error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to approve return." });
  }
};

// @desc    Admin Marks Returned Product Received at Facility
// @route   PUT /api/returns/:id/receive
// @access  Private/Admin
const markProductReceived = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = await Order.findById(returnRequest.orderId);
    const adminName = req.user?.name || "Admin";

    returnRequest.status = "Product Received";
    returnRequest.receivedAt = new Date();
    
    if (req.body.adminRemark) {
      returnRequest.adminRemark = req.body.adminRemark;
    }

    returnRequest.returnTimeline.push({
      status: "Product Received",
      message: `Product package delivered to Venus Care inspection center by courier partner.`,
      timestamp: new Date(),
      updatedBy: adminName,
    });

    await returnRequest.save();

    if (order) {
      order.status = "Product Received";
      order.orderTimeline.push({
        status: "Product Received",
        timestamp: new Date(),
        updatedBy: adminName,
      });
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Returned package marked as received. Quality inspection is now unlocked.",
      returnRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Executes Product Quality Inspection (Pass/Fail)
// @route   POST /api/returns/:id/quality-check
// @access  Private/Admin
const performQualityCheck = async (req, res) => {
  try {
    const { status, remarks, checklist } = req.body;
    
    if (!["Passed", "Failed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Quality check status must be 'Passed' or 'Failed'." });
    }

    if (status === "Failed" && (!remarks || remarks.trim().length < 10)) {
      return res.status(400).json({ success: false, message: "Please provide a detailed quality inspection failure remark (minimum 10 characters)." });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = await Order.findById(returnRequest.orderId);
    const adminName = req.user?.name || "Admin";

    returnRequest.qualityCheckedAt = new Date();
    returnRequest.qualityCheckStatus = status;
    returnRequest.qualityCheckRemarks = remarks || "";
    
    if (checklist) {
      returnRequest.qualityCheckChecklist = {
        isConditionAcceptable: checklist.isConditionAcceptable ?? true,
        isProductOpened: checklist.isProductOpened ?? false,
        isDamaged: checklist.isDamaged ?? false,
        isQuantityCorrect: checklist.isQuantityCorrect ?? true,
        isPackagingIntact: checklist.isPackagingIntact ?? true,
      };
    }

    if (status === "Passed") {
      returnRequest.status = "Quality Check Passed";
      returnRequest.refundStatus = "Pending";

      // Authoritative Single-Instance Inventory Restock Guarantee
      if (!returnRequest.inventoryRestocked && order) {
        for (const item of order.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(item.productId, {
              $inc: { stock: item.qty },
            });
          }
        }
        returnRequest.inventoryRestocked = true;
        returnRequest.inventoryRestockedAt = new Date();
      }

      returnRequest.returnTimeline.push({
        status: "Quality Check Passed",
        message: `Quality inspection passed. Product restocked to warehouse inventory. Refund queued for execution. Remarks: ${remarks || "Condition verified."}`,
        timestamp: new Date(),
        updatedBy: adminName,
      });

      if (order) {
        order.status = "Quality Check Passed";
        order.orderTimeline.push({
          status: "Quality Check Passed",
          timestamp: new Date(),
          updatedBy: adminName,
        });
        await order.save();
      }
    } else {
      // Quality Check Failed
      returnRequest.status = "Quality Check Failed";
      returnRequest.refundStatus = "Failed";
      returnRequest.refundFailureReason = `Quality inspection rejected: ${remarks}`;

      returnRequest.returnTimeline.push({
        status: "Quality Check Failed",
        message: `Quality check rejected by inspector. Reason: ${remarks}`,
        timestamp: new Date(),
        updatedBy: adminName,
      });

      if (order) {
        order.status = "Quality Check Failed";
        order.orderTimeline.push({
          status: "Quality Check Failed",
          timestamp: new Date(),
          updatedBy: adminName,
        });
        await order.save();
      }
    }

    await returnRequest.save();

    res.status(200).json({
      success: true,
      message: `Quality check ${status === "Passed" ? "approved" : "rejected"} successfully.`,
      returnRequest,
    });
  } catch (error) {
    console.error("Quality check error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Executes Authoritative Server-Side Refund (Razorpay / Bank / UPI) (Idempotent)
// @route   POST /api/returns/:id/refund
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = await Order.findById(returnRequest.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Associated order not found" });
    }

    // 1. Verify Quality Inspection
    if (returnRequest.qualityCheckStatus !== "Passed") {
      return res.status(400).json({
        success: false,
        message: "Cannot issue refund until product quality check has been performed and approved.",
      });
    }

    // 2. Idempotency Check: Prevent duplicate refunds
    if (returnRequest.refundStatus === "Completed") {
      return res.status(200).json({
        success: true,
        message: "Refund has already been completed for this return request.",
        returnRequest,
        isIdempotent: true,
      });
    }

    const adminName = req.user?.name || "Admin";
    const refundAmount = Number(returnRequest.refundAmount || order.totalAmount);
    returnRequest.refundAttempts += 1;
    returnRequest.refundInitiatedAt = new Date();

    // 3. Process Refund via Razorpay if order was prepaid
    if (order.paymentMethod === "Razorpay" && order.paymentId) {
      try {
        if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "your_razorpay_key_id") {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          const refundResponse = await razorpay.payments.refund(order.paymentId, {
            amount: Math.round(refundAmount * 100),
            notes: {
              returnRequestId: returnRequest._id.toString(),
              orderId: order._id.toString(),
            },
          });

          returnRequest.refundId = refundResponse.id || `RFND-RZP-${Date.now()}`;
        } else {
          // Development / Mock Razorpay Refund
          returnRequest.refundId = `RFND-MOCK-${Date.now().toString().slice(-8)}`;
        }

        returnRequest.refundStatus = "Completed";
        returnRequest.refundCompletedAt = new Date();
        returnRequest.status = "Refund Completed";
      } catch (refundErr) {
        console.error("Razorpay refund execution failed:", refundErr);
        returnRequest.refundStatus = "Failed";
        returnRequest.status = "Refund Failed";
        returnRequest.refundFailureReason = refundErr.message || "Gateway refund API call failed";
        await returnRequest.save();

        return res.status(500).json({
          success: false,
          message: `Gateway refund failed: ${refundErr.message}. You can retry or process via Bank Transfer.`,
          returnRequest,
        });
      }
    } else {
      // 4. Process COD / Bank / UPI Refund Payout
      const transactionRef = req.body.transactionRef || req.body.refundTransactionId || `PAYOUT-UTR-${Date.now().toString().slice(-8)}`;
      returnRequest.refundId = transactionRef;
      returnRequest.refundStatus = "Completed";
      returnRequest.refundCompletedAt = new Date();
      returnRequest.status = "Refund Completed";
    }

    // 5. Add Timeline Event & Sync Order Status
    returnRequest.returnTimeline.push({
      status: "Refund Completed",
      message: `Refund of ₹${refundAmount.toFixed(2)} completed via ${returnRequest.refundMethod || order.paymentMethod}. Transaction Ref: ${returnRequest.refundId}.`,
      timestamp: new Date(),
      updatedBy: adminName,
    });

    await returnRequest.save();

    // 6. Update Order Status
    order.status = "Refund Completed";
    order.paymentStatus = "Refunded";
    order.refundedAt = new Date();
    order.refundDate = new Date();
    order.refundStatus = "Refunded";
    order.refundTransactionId = returnRequest.refundId;
    order.orderTimeline.push({
      status: "Refund Completed",
      timestamp: new Date(),
      updatedBy: adminName,
    });
    await order.save();

    // 7. Send Customer Confirmation Email
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Refund Completed").catch((err) => {
      console.error("❌ Refund Completed email failed:", err.message);
    });

    res.status(200).json({
      success: true,
      message: `Refund of ₹${refundAmount.toFixed(2)} completed successfully!`,
      returnRequest,
    });
  } catch (error) {
    console.error("Process refund error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Rejects Return Request with Mandatory Reason
// @route   POST /api/returns/:id/reject
// @access  Private/Admin
const rejectReturn = async (req, res) => {
  try {
    const { reason, adminRemark } = req.body;
    const rejectionNote = reason || adminRemark;

    if (!rejectionNote || rejectionNote.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide a clear rejection explanation for the customer (minimum 10 characters).",
      });
    }

    const returnRequest = await ReturnRequest.findById(req.params.id);
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    const order = await Order.findById(returnRequest.orderId);
    const adminName = req.user?.name || "Admin";

    returnRequest.status = "Return Rejected";
    returnRequest.rejectedAt = new Date();
    returnRequest.adminRemark = rejectionNote.trim();

    returnRequest.returnTimeline.push({
      status: "Return Rejected",
      message: `Return request declined by quality administration. Reason: ${rejectionNote.trim()}`,
      timestamp: new Date(),
      updatedBy: adminName,
    });

    await returnRequest.save();

    if (order) {
      order.status = "Delivered"; // Reverts to Delivered
      order.orderTimeline.push({
        status: "Return Rejected",
        timestamp: new Date(),
        updatedBy: adminName,
      });
      await order.save();

      const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
      sendTimelineStatusEmailAsync(order, "Return Rejected").catch((err) => {
        console.error("❌ Return Rejected email failed:", err.message);
      });
    }

    res.status(200).json({
      success: true,
      message: "Return request rejected successfully.",
      returnRequest,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Secure Courier Webhook Endpoint (Idempotent Milestone Sync)
// @route   POST /api/returns/courier/webhook
// @access  Public (Webhook with Token / Signature)
const handleCourierWebhook = async (req, res) => {
  try {
    const { event, eventId, trackingId, status, timestamp, location } = req.body;

    if (!trackingId) {
      return res.status(400).json({ success: false, message: "trackingId is required" });
    }

    const returnRequest = await ReturnRequest.findOne({ pickupTrackingId: trackingId });
    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Matching return record not found for tracking ID" });
    }

    // Idempotency check: check if eventId already processed
    const alreadyLogged = returnRequest.courierLogs.some((l) => l.rawData?.eventId === eventId);
    if (eventId && alreadyLogged) {
      return res.status(200).json({ success: true, message: "Event already processed (idempotent)", returnRequest });
    }

    // Map courier status to internal state machine
    let newStatus = returnRequest.status;
    let timelineMsg = `Logistics update: ${event || status} at ${location || "transit hub"}.`;

    if (event === "picked_up" || status === "PICKED_UP") {
      newStatus = "Picked Up";
      returnRequest.pickedUpAt = new Date();
      timelineMsg = "Courier collected product parcel from customer doorstep.";
    } else if (event === "in_transit" || status === "IN_TRANSIT") {
      newStatus = "In Transit";
      timelineMsg = `Parcel in transit to Venus Care fulfillment hub (Location: ${location || "Sorting Center"}).`;
    } else if (event === "delivered" || event === "reached_destination" || status === "DELIVERED") {
      newStatus = "Product Received";
      returnRequest.receivedAt = new Date();
      timelineMsg = "Return shipment delivered at Venus Care quality inspection warehouse.";
    } else if (event === "pickup_failed" || status === "PICKUP_FAILED") {
      newStatus = "Pickup Failed";
      timelineMsg = `Reverse pickup attempt failed: ${req.body.reason || "Customer unavailable / unreachable"}.`;
    }

    returnRequest.status = newStatus;
    returnRequest.courierLogs.push({
      event: event || status,
      status: newStatus,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      rawData: req.body,
    });

    returnRequest.returnTimeline.push({
      status: newStatus,
      message: timelineMsg,
      timestamp: new Date(),
      updatedBy: "Courier Partner",
    });

    await returnRequest.save();

    // Sync with order
    const order = await Order.findById(returnRequest.orderId);
    if (order) {
      order.status = newStatus;
      order.orderTimeline.push({
        status: newStatus,
        timestamp: new Date(),
        updatedBy: "Courier Partner",
      });
      await order.save();
    }

    res.status(200).json({ success: true, message: "Webhook processed successfully", status: newStatus });
  } catch (error) {
    console.error("Courier webhook processing error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Legacy Status Update for Backward Compatibility
// @route   PUT /api/returns/:id
// @access  Private/Admin
const updateReturnStatus = async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    const request = await ReturnRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    if (status) request.status = status;
    if (adminRemark !== undefined) request.adminRemark = adminRemark;

    request.returnTimeline.push({
      status: status || request.status,
      message: adminRemark || `Status changed to ${status}`,
      timestamp: new Date(),
      updatedBy: req.user?.name || "Admin",
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: `Return request status updated to ${status}`,
      request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOrderForReturn,
  createReturnRequest,
  getMyReturns,
  getReturns,
  approveReturnAndCreatePickup,
  markProductReceived,
  performQualityCheck,
  processRefund,
  rejectReturn,
  handleCourierWebhook,
  updateReturnStatus,
};
