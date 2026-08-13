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

  images: {
    type: [String],
    default: []
  },

  subtitle: {
    type: String,
    default: ""
  },

  tagline: {
    type: String,
    default: ""
  },

  highlights: {
    type: [String],
    default: []
  },

  howToUse: {
    type: String,
    default: ""
  },

  ingredients: {
    type: String,
    default: ""
  },

  benefits: {
    type: [String],
    default: []
  },

  faq: [
    {
      question: { type: String, default: "" },
      answer: { type: String, default: "" }
    }
  ],

  otherInfo: {
    type: String,
    default: ""
  },

  comboProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],

  notes: [
    {
      title: { type: String, default: "" },
      image: { type: String, default: "" },
      description: { type: String, default: "" }
    }
  ],

  usageTags: {
    type: [String],
    default: []
  },

  isBestSeller: {
    type: Boolean,
    default: false
  },

  discountPercentage: {
    type: Number,
    default: 0
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
  },

  // Redesign Fields
  gallery: {
    type: [String],
    default: []
  },
  trustBadges: {
    type: [String],
    default: []
  },
  notesInSet: [
    {
      image: { type: String, default: "" },
      title: { type: String, default: "" },
      note1: { type: String, default: "" },
      note2: { type: String, default: "" },
      note3: { type: String, default: "" }
    }
  ],
  wearTags: {
    type: [String],
    default: []
  },
  productHighlights: {
    type: String,
    default: ""
  },
  otherInformation: {
    type: String,
    default: ""
  },
  seo: {
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    metaKeywords: { type: String, default: "" }
  },
  averageRating: {
    type: Number,
    default: 4.8
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