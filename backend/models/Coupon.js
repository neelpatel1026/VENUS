const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters"],
      maxlength: [30, "Coupon code cannot exceed 30 characters"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    discountType: {
      type: String,
      enum: {
        values: ["percentage", "fixed"],
        message: "discountType must be either 'percentage' or 'fixed'",
      },
      default: "percentage",
    },

    discount: {
      type: Number,
      required: true,
      min: [0.01, "Discount must be positive"],
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "Expiry date must be after or equal to the start date",
      },
    },

    minOrderValue: {
      type: Number,
      default: 0,
      min: [0, "Minimum order value cannot be negative"],
    },

    maxDiscount: {
      type: Number,
      default: 0, // 0 means no cap
      min: [0, "Maximum discount cannot be negative"],
    },

    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
      min: [0, "Usage limit cannot be negative"],
    },

    perUserLimit: {
      type: Number,
      default: 1,
      min: [1, "Per user limit must be at least 1"],
    },

    totalUsage: {
      type: Number,
      default: 0,
      min: [0, "Total usage cannot be negative"],
    },

    active: {
      type: Boolean,
      default: true,
    },

    applicableCategories: [
      {
        type: String,
        trim: true,
      },
    ],

    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    applicableBrands: [
      {
        type: String,
        trim: true,
      },
    ],

    firstOrderOnly: {
      type: Boolean,
      default: false,
    },

    newUserOnly: {
      type: Boolean,
      default: false,
    },

    loggedInOnly: {
      type: Boolean,
      default: true,
    },

    singleUsePerOrder: {
      type: Boolean,
      default: true,
    },

    autoApply: {
      type: Boolean,
      default: false,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    stackable: {
      type: Boolean,
      default: false,
    },

    allowCombination: {
      type: Boolean,
      default: false,
    },

    priority: {
      type: Number,
      default: 0,
      min: [0, "Priority cannot be negative"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Production Indexes for Coupon collection
couponSchema.index({ active: 1, expiryDate: 1 });
couponSchema.index({ code: 1, active: 1 }, { unique: true });
couponSchema.index({ priority: 1 });

module.exports = mongoose.model("Coupon", couponSchema);