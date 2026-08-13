



const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

let productCache = null;
let cacheTimestamp = 0;

const getProducts = async (req, res) => {
  const startTime = Date.now();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Use lightweight memory caching for default requests
    if (page === 1 && limit === 100 && sortBy === 'createdAt' && sortOrder === -1) {
      if (productCache && (Date.now() - cacheTimestamp < 60000)) {
        res.set("X-Cache", "HIT");
        res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
        return res.status(200).json(productCache);
      }
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const products = await Product.find({})
      .select("name description category price originalPrice stock imageUrl images subtitle tagline highlights howToUse ingredients benefits faq otherInfo comboProducts notes usageTags isBestSeller discountPercentage rating reviewCount availableAsGift giftWrapAvailable luxuryGiftBoxAvailable giftMessageAllowed giftBadgeText estimatedPackingTime giftPrice createdAt")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .maxTimeMS(8000) // 8 seconds MongoDB timeout guard
      .lean();

    if (page === 1 && limit === 100 && sortBy === 'createdAt' && sortOrder === -1) {
      productCache = products;
      cacheTimestamp = Date.now();
    }

    res.set("X-Cache", "MISS");
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=30");
    res.status(200).json(products);

  } catch (error) {
    console.error(`🔴 API ERROR in getProducts: route=${req.originalUrl} query=${JSON.stringify(req.query)} time=${Date.now() - startTime}ms err=${error.message}`);
    res.status(500).json({
      message: "Unable to load products. Please try again.",
    });
  }
};

const getFeaturedProducts = async (req, res) => {
  const startTime = Date.now();
  try {
    const products = await Product.find({ isBestSeller: true })
      .select("_id name slug price originalPrice rating imageUrl stock category subtitle")
      .limit(8)
      .maxTimeMS(3000)
      .lean();

    const duration = Date.now() - startTime;
    console.log(`[PERFORMANCE] GET /api/products/featured | Duration: ${duration}ms | Payload size: ~${JSON.stringify(products).length} bytes`);
    res.status(200).json(products);
  } catch (error) {
    console.error("🔴 Error fetching featured products:", error);
    res.status(500).json({ message: "Unable to load featured collection." });
  }
};

const invalidateProductCache = () => {
  productCache = null;
  cacheTimestamp = 0;
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    ).populate('comboProducts');

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    res.status(200).json(product);

  } catch (error) {
    if (error.kind === 'ObjectId' || error.name === 'CastError') {
      return res.status(404).json({
        message: 'Product not found',
      });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  try {

    const {
      name,
      description,
      price,
      category,
      stock,
      originalPrice,
    } = req.body;

    if (Number(price) < 0) {
  return res.status(400).json({
    message: "Price cannot be negative"
  });
}

if (Number(originalPrice) < 0) {
  return res.status(400).json({
    message: "Original Price cannot be negative"
  });
}

if (Number(originalPrice) < Number(price)) {
  return res.status(400).json({
    message: "Original Price must be greater than or equal to Price"
  });
}

if (Number(stock) < 0) {
  return res.status(400).json({
    message: "Stock cannot be negative"
  });
}

    // Validation
    if (
      !name ||
      !description ||
      !price ||
      !originalPrice ||
      !category
    ) {
      return res.status(400).json({
        message: 'Please fill all required fields',
      });
    }

    let imageUrl = '';

    if (req.file) {

      const result =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: 'venus-products',
          }
        );

      imageUrl = result.secure_url;

      // Delete local file
      fs.unlinkSync(req.file.path);
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category,
      stock: stock || 0,
      imageUrl,
      originalPrice,
      availableAsGift: req.body.availableAsGift === 'true' || req.body.availableAsGift === true,
      giftWrapAvailable: req.body.giftWrapAvailable === 'true' || req.body.giftWrapAvailable === true,
      luxuryGiftBoxAvailable: req.body.luxuryGiftBoxAvailable === 'true' || req.body.luxuryGiftBoxAvailable === true,
      giftMessageAllowed: req.body.giftMessageAllowed === 'true' || req.body.giftMessageAllowed === true,
      giftBadgeText: req.body.giftBadgeText || "",
      estimatedPackingTime: req.body.estimatedPackingTime || "1-2 days",
      giftPrice: req.body.giftPrice || 0,
      
      // Extended Premium fields
      images: req.body.images ? (typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images) : [],
      subtitle: req.body.subtitle || "",
      tagline: req.body.tagline || "",
      highlights: req.body.highlights ? (typeof req.body.highlights === 'string' ? JSON.parse(req.body.highlights) : req.body.highlights) : [],
      howToUse: req.body.howToUse || "",
      ingredients: req.body.ingredients || "",
      benefits: req.body.benefits ? (typeof req.body.benefits === 'string' ? JSON.parse(req.body.benefits) : req.body.benefits) : [],
      faq: req.body.faq ? (typeof req.body.faq === 'string' ? JSON.parse(req.body.faq) : req.body.faq) : [],
      otherInfo: req.body.otherInfo || "",
      comboProducts: req.body.comboProducts ? (typeof req.body.comboProducts === 'string' ? JSON.parse(req.body.comboProducts) : req.body.comboProducts) : [],
      notes: req.body.notes ? (typeof req.body.notes === 'string' ? JSON.parse(req.body.notes) : req.body.notes) : [],
      usageTags: req.body.usageTags ? (typeof req.body.usageTags === 'string' ? JSON.parse(req.body.usageTags) : req.body.usageTags) : [],
      isBestSeller: req.body.isBestSeller === 'true' || req.body.isBestSeller === true,
      discountPercentage: req.body.discountPercentage ? Number(req.body.discountPercentage) : 0,

      // Redesign additions
      gallery: req.body.gallery ? (typeof req.body.gallery === 'string' ? JSON.parse(req.body.gallery) : req.body.gallery) : [],
      trustBadges: req.body.trustBadges ? (typeof req.body.trustBadges === 'string' ? JSON.parse(req.body.trustBadges) : req.body.trustBadges) : [],
      notesInSet: req.body.notesInSet ? (typeof req.body.notesInSet === 'string' ? JSON.parse(req.body.notesInSet) : req.body.notesInSet) : [],
      wearTags: req.body.wearTags ? (typeof req.body.wearTags === 'string' ? JSON.parse(req.body.wearTags) : req.body.wearTags) : [],
      productHighlights: req.body.productHighlights || "",
      otherInformation: req.body.otherInformation || "",
      seo: req.body.seo ? (typeof req.body.seo === 'string' ? JSON.parse(req.body.seo) : req.body.seo) : { metaTitle: "", metaDescription: "", metaKeywords: "" }
    });

    invalidateProductCache();
    res.status(201).json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    const {
      name,
      description,
      price,
      category,
      stock,
      originalPrice,
    } = req.body;

    const finalPrice = price !== undefined ? Number(price) : product.price;
    const finalOriginalPrice = originalPrice !== undefined ? Number(originalPrice) : product.originalPrice;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({
        message: "Price cannot be negative"
      });
    }

    if (originalPrice !== undefined && Number(originalPrice) < 0) {
      return res.status(400).json({
        message: "Original Price cannot be negative"
      });
    }

    if (finalOriginalPrice < finalPrice) {
      return res.status(400).json({
        message: "Original Price must be greater than or equal to Price"
      });
    }

    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = Number(originalPrice);

    if (name) product.name = name.trim();

    if (description)
      product.description = description.trim();

    if (category)
      product.category = category;

    if (stock !== undefined)
      product.stock = stock;

    if (req.body.availableAsGift !== undefined)
      product.availableAsGift = req.body.availableAsGift === 'true' || req.body.availableAsGift === true;
    if (req.body.giftWrapAvailable !== undefined)
      product.giftWrapAvailable = req.body.giftWrapAvailable === 'true' || req.body.giftWrapAvailable === true;
    if (req.body.luxuryGiftBoxAvailable !== undefined)
      product.luxuryGiftBoxAvailable = req.body.luxuryGiftBoxAvailable === 'true' || req.body.luxuryGiftBoxAvailable === true;
    if (req.body.giftMessageAllowed !== undefined)
      product.giftMessageAllowed = req.body.giftMessageAllowed === 'true' || req.body.giftMessageAllowed === true;
    if (req.body.giftBadgeText !== undefined)
      product.giftBadgeText = req.body.giftBadgeText;
    if (req.body.estimatedPackingTime !== undefined)
      product.estimatedPackingTime = req.body.estimatedPackingTime;
    if (req.body.giftPrice !== undefined)
      product.giftPrice = req.body.giftPrice;

    // Extended Premium fields
    if (req.body.images !== undefined) {
      product.images = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
    }
    if (req.body.subtitle !== undefined) product.subtitle = req.body.subtitle;
    if (req.body.tagline !== undefined) product.tagline = req.body.tagline;
    if (req.body.highlights !== undefined) {
      product.highlights = typeof req.body.highlights === 'string' ? JSON.parse(req.body.highlights) : req.body.highlights;
    }
    if (req.body.howToUse !== undefined) product.howToUse = req.body.howToUse;
    if (req.body.ingredients !== undefined) product.ingredients = req.body.ingredients;
    if (req.body.benefits !== undefined) {
      product.benefits = typeof req.body.benefits === 'string' ? JSON.parse(req.body.benefits) : req.body.benefits;
    }
    if (req.body.faq !== undefined) {
      product.faq = typeof req.body.faq === 'string' ? JSON.parse(req.body.faq) : req.body.faq;
    }
    if (req.body.otherInfo !== undefined) product.otherInfo = req.body.otherInfo;
    if (req.body.comboProducts !== undefined) {
      product.comboProducts = typeof req.body.comboProducts === 'string' ? JSON.parse(req.body.comboProducts) : req.body.comboProducts;
    }
    if (req.body.notes !== undefined) {
      product.notes = typeof req.body.notes === 'string' ? JSON.parse(req.body.notes) : req.body.notes;
    }
    if (req.body.usageTags !== undefined) {
      product.usageTags = typeof req.body.usageTags === 'string' ? JSON.parse(req.body.usageTags) : req.body.usageTags;
    }
    if (req.body.isBestSeller !== undefined) {
      product.isBestSeller = req.body.isBestSeller === 'true' || req.body.isBestSeller === true;
    }
    if (req.body.discountPercentage !== undefined) {
      product.discountPercentage = Number(req.body.discountPercentage);
    }

    // Redesign additions
    if (req.body.gallery !== undefined) {
      product.gallery = typeof req.body.gallery === 'string' ? JSON.parse(req.body.gallery) : req.body.gallery;
    }
    if (req.body.trustBadges !== undefined) {
      product.trustBadges = typeof req.body.trustBadges === 'string' ? JSON.parse(req.body.trustBadges) : req.body.trustBadges;
    }
    if (req.body.notesInSet !== undefined) {
      product.notesInSet = typeof req.body.notesInSet === 'string' ? JSON.parse(req.body.notesInSet) : req.body.notesInSet;
    }
    if (req.body.wearTags !== undefined) {
      product.wearTags = typeof req.body.wearTags === 'string' ? JSON.parse(req.body.wearTags) : req.body.wearTags;
    }
    if (req.body.productHighlights !== undefined) product.productHighlights = req.body.productHighlights;
    if (req.body.otherInformation !== undefined) product.otherInformation = req.body.otherInformation;
    if (req.body.seo !== undefined) {
      product.seo = typeof req.body.seo === 'string' ? JSON.parse(req.body.seo) : req.body.seo;
    }

    if (req.file) {

      const result =
        await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: 'venus-products',
          }
        );

      product.imageUrl = result.secure_url;

      // Delete local file
      fs.unlinkSync(req.file.path);
    }

    const updatedProduct =
      await product.save();

    invalidateProductCache();
    res.status(200).json(
      updatedProduct
    );

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    await product.deleteOne();

    invalidateProductCache();
    res.status(200).json({
      message: 'Product removed successfully',
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};