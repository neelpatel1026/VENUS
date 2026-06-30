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
  }
},
{
  timestamps: true
});

module.exports = mongoose.model("Product", productSchema);