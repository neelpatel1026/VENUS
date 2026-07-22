const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    review: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1000,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    unhelpfulCount: {
      type: Number,
      default: 0,
    },
    unhelpfulUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String,
      },
    ],
    video: {
      type: String,
    },
    location: {
      type: String,
      default: "",
    },
    variant: {
      type: String,
      default: "",
    },
    edited: {
      type: Boolean,
      default: false,
    },
    recommend: {
      type: Boolean,
      default: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    reported: {
      type: Boolean,
      default: false,
    },
    merchantReply: {
      replyText: { type: String, default: "" },
      repliedAt: { type: Date }
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
    skinType: {
      type: String,
      default: "",
    },
    ageGroup: {
      type: String,
      default: "",
    },
    pros: {
      type: String,
      default: "",
    },
    cons: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Production Indexes for Review collection
reviewSchema.index({ productId: 1, isHidden: 1 });
reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ isHidden: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model("Review", reviewSchema);