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
        "Confirmed",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Pending",
    },

    deliveredAt: {
      type: Date,
    },

    returnAllowedTill: {
      type: Date,
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
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1 });

module.exports = mongoose.model("Order", orderSchema);
