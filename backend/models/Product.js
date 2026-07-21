const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },

  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  imageUrl: {
    type: String,
    required: true
  },

  rating: {
    type: Number,
    default: 4.8,
    min: 0,
    max: 5
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  availableAsGift: {
    type: Boolean,
    default: false
  },

  giftWrapAvailable: {
    type: Boolean,
    default: false
  },

  luxuryGiftBoxAvailable: {
    type: Boolean,
    default: false
  },

  giftMessageAllowed: {
    type: Boolean,
    default: false
  },

  giftBadgeText: {
    type: String,
    default: ""
  },

  estimatedPackingTime: {
    type: String,
    default: "1-2 days"
  },

  giftPrice: {
    type: Number,
    default: 0
  }
},
{
  timestamps: true
});

// Production Indexes for Product collection
productSchema.index({ category: 1, price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text", description: "text", category: "text" });

module.exports = mongoose.model("Product", productSchema);