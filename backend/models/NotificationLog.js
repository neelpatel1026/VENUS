const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ReturnRequest",
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["EMAIL", "SMS", "WHATSAPP"],
      default: "EMAIL",
      required: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      default: "",
    },
    messageBody: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["SENT", "FAILED", "SKIPPED_DUPLICATE", "SKIPPED"],
      default: "SENT",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      default: "Resend",
    },
    providerMessageId: {
      type: String,
      default: "",
    },
    error: {
      type: String,
      default: "",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index for High-Performance Idempotency Lookups
notificationLogSchema.index({ orderId: 1, eventType: 1, channel: 1, status: 1 });
notificationLogSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
