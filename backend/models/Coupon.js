const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },

    discount: {
      type: Number,
      required: true,
      min: 1,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    minOrderValue: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      default: 0, // 0 means no cap
    },

    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },

    perUserLimit: {
      type: Number,
      default: 1,
    },

    totalUsage: {
      type: Number,
      default: 0,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Production Indexes for Coupon collection
couponSchema.index({ active: 1, expiryDate: 1 });
couponSchema.index({ code: 1, active: 1 });

module.exports = mongoose.model("Coupon", couponSchema);