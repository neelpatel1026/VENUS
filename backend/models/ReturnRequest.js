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

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    returnImages: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Pickup Scheduled",
        "Picked Up",
        "Refund Initiated",
        "Refunded",
        "Rejected",
      ],
      default: "Pending",
    },
    bankName: String,
    accountHolder: String,
    accountNumber: String,
    ifscCode: String,
    refundMethod: {
      type: String,
      enum: ["Bank", "UPI"],
    },
    upiId: String,
    refundProof: String,

    adminRemark: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ReturnRequest", returnRequestSchema);
