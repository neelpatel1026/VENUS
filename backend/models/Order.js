const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    /* USER REFERENCE */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* CUSTOMER SNAPSHOT */

    customerName: {
      type: String,
      required: true,
    },

    customerEmail: {
      type: String,
      required: true,
    },

    customerPhone: {
      type: String,
      required: true,
    },

    /* PRODUCTS */

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        productName: {
          type: String,
          required: true,
        },

        productImage: {
          type: String,
        },

        qty: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
        },
      },
    ],

    /* TOTALS */

    subtotal: {
      type: Number,
      default: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    /* SHIPPING ADDRESS */

    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      addressLine1: {
        type: String,
        required: true,
      },

      addressLine2: {
        type: String,
      },

      city: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      pincode: {
        type: String,
        required: true,
      },

      country: {
        type: String,
        required: true,
      },
    },

    /* PAYMENT */

    paymentMethod: {
      type: String,
      enum: ["COD", "Razorpay"],
      default: "COD",
    },

    paymentId: {
      type: String,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    /* ORDER STATUS */

    status: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Return Requested",
        "Return Approved",
        "Refund Completed",
        "Returned",
      ],
      default: "Pending",
    },

    orderTimeline: [
      {
        status: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: String,
          default: "System",
        },
      },
    ],

    deliveredAt: {
      type: Date,
    },

    returnAllowedTill: {
      type: Date,
    },

    reviewEligible: {
      type: Boolean,
      default: false,
    },

    reviewReminderSent: {
      type: Boolean,
      default: false,
    },

    reviewReminderCount: {
      type: Number,
      default: 0,
    },

    lastReviewReminderSentAt: {
      type: Date,
      default: null,
    },

    reviewCampaignCompleted: {
      type: Boolean,
      default: false,
    },

    refundedAt: {
      type: Date,
    },

    refundTracking: {
      status: {
        type: String,
        default: "",
      },

      updatedAt: {
        type: Date,
      },
    },

    /* ADMIN NOTES */

    adminNotes: {
      type: String,
      default: "",
    },

    adminNotesLog: [
      {
        noteText: String,
        adminName: { type: String, default: "Admin" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },

    tags: [
      {
        type: String,
      },
    ],

    courier: {
      type: String,
      default: "",
    },

    trackingNumber: {
      type: String,
      default: "",
    },

    expectedDeliveryDate: {
      type: Date,
    },

    dispatchDate: {
      type: Date,
    },

    shippingCost: {
      type: Number,
      default: 0,
    },

    isGift: {
      type: Boolean,
      default: false,
    },

    giftWrap: {
      type: Boolean,
      default: false,
    },

    giftBox: {
      type: Boolean,
      default: false,
    },

    giftMessage: {
      type: String,
      default: "",
    },

    giftReceipt: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Production Indexes for Order collection
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ "items.productId": 1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ customerPhone: 1 });

module.exports = mongoose.model("Order", orderSchema);
