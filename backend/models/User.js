const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    googleId: {
      type: String,
      default: "",
    },

    otp: {
      type: String,
      default: "",
    },

    otpExpire: {
      type: Date,
      default: null,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      type: String,
      default: "",
    },

    emailOtpExpire: {
      type: Date,
      default: null,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    otpSendCount: {
      type: Number,
      default: 0,
    },

    otpSendResetTime: {
      type: Date,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    addresses: [
      {
        label: {
          type: String,
          enum: ["Home", "Work", "Office", "Hotel", "Other"],
          default: "Home"
        },
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: String,
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, required: true, default: "India" },
        placeId: String,
        lat: Number,
        lng: Number,
        formattedAddress: String,
        deliveryZone: String,
        isDefault: { type: Boolean, default: false },
        isVerified: { type: Boolean, default: false }
      },
    ],
    walletBalance: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalRedeemed: {
      type: Number,
      default: 0,
    },
    isWalletFrozen: {
      type: Boolean,
      default: false,
    },
    rewardTransactions: [
      {
        transactionType: {
          type: String,
          enum: ["Earned", "Used", "Expired", "Adjusted", "Refund Reversal"],
          required: true,
        },
        coins: {
          type: Number,
          required: true,
        },
        orderId: {
          type: String,
          default: "",
        },
        adminName: {
          type: String,
          default: "",
        },
        description: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }
    ]
  },
  { timestamps: true },
);

// Production Indexes for User collection
userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ googleId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
