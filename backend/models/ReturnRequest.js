const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reasonCategory: {
      type: String,
      enum: [
        "Product Damaged",
        "Wrong Product Received",
        "Product Different from Description",
        "Product Quality Issue",
        "Product Arrived Opened / Leaking",
        "Product Expired",
        "Missing Item",
        "Product Does Not Meet Expectations",
        "Other",
      ],
      required: [true, "Return reason category is required"],
    },

    reason: {
      type: String,
      required: [true, "Detailed explanation is required"],
      trim: true,
      minlength: [15, "Explanation must be at least 15 characters long"],
    },

    returnImages: {
      type: [String],
      required: [true, "At least one product photo is required"],
      validate: {
        validator: function (val) {
          return Array.isArray(val) && val.length >= 1;
        },
        message: "At least one product photo is required",
      },
    },

    // Standardized Return State Machine
    status: {
      type: String,
      enum: [
        "Return Requested",
        "Return Under Review",
        "Return Approved",
        "Pickup Created",
        "Pickup Scheduled",
        "Picked Up",
        "In Transit",
        "Product Received",
        "Quality Check",
        "Quality Check Passed",
        "Quality Check Failed",
        "Refund Pending",
        "Refund Initiated",
        "Refund Completed",
        "Refund Failed",
        "Return Rejected",
        "Pickup Failed",
        "Cancelled",
        // Legacy compatibility mappings
        "Pending",
        "Approved",
        "Refunded",
        "Rejected",
      ],
      default: "Return Requested",
    },

    adminRemark: {
      type: String,
      default: "",
      trim: true,
    },

    // Approval / Rejection Timestamps
    approvedAt: Date,
    rejectedAt: Date,

    // Reverse Logistics / Courier Fields
    pickupProvider: {
      type: String,
      default: "Venus Express Logistics",
    },
    pickupRequestId: String,
    pickupTrackingId: String,
    pickupScheduledAt: Date,
    pickupEstimatedDate: Date,
    pickedUpAt: Date,
    receivedAt: Date,
    courierTrackingUrl: String,
    courierLogs: [
      {
        event: String,
        status: String,
        timestamp: { type: Date, default: Date.now },
        rawData: mongoose.Schema.Types.Mixed,
      },
    ],

    // Quality Inspection Fields
    qualityCheckedAt: Date,
    qualityCheckStatus: {
      type: String,
      enum: ["Pending", "Passed", "Failed"],
      default: "Pending",
    },
    qualityCheckRemarks: {
      type: String,
      default: "",
    },
    qualityCheckChecklist: {
      isConditionAcceptable: { type: Boolean, default: true },
      isProductOpened: { type: Boolean, default: false },
      isDamaged: { type: Boolean, default: false },
      isQuantityCorrect: { type: Boolean, default: true },
      isPackagingIntact: { type: Boolean, default: true },
    },
    qualityInspectionImages: [String],

    // Refund Processing Fields
    refundMethod: {
      type: String,
      enum: ["Original Payment Method", "Razorpay", "Bank", "UPI", "Store Credit"],
      default: "Original Payment Method",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ["Pending", "Initiated", "Completed", "Failed", ""],
      default: "Pending",
    },
    refundId: String, // Razorpay Refund ID or Bank UTR
    refundInitiatedAt: Date,
    refundCompletedAt: Date,
    refundFailureReason: String,
    refundAttempts: {
      type: Number,
      default: 0,
    },

    // Bank / UPI Details for COD Payouts
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String,
    refundProof: String,

    // Authoritative Single-Instance Inventory Restock Flag
    inventoryRestocked: {
      type: Boolean,
      default: false,
    },
    inventoryRestockedAt: Date,

    // Structured Return Audit Timeline
    returnTimeline: [
      {
        status: { type: String, required: true },
        message: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: String, default: "System" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Production Indexes for ReturnRequest collection
returnRequestSchema.index({ userId: 1, createdAt: -1 });
returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });
returnRequestSchema.index({ pickupTrackingId: 1 }, { sparse: true });
returnRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
