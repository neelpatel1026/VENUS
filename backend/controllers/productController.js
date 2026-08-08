



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
      .select("name description category price originalPrice stock imageUrl rating reviewCount availableAsGift giftWrapAvailable luxuryGiftBoxAvailable giftMessageAllowed giftBadgeText estimatedPackingTime giftPrice createdAt")
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

const invalidateProductCache = () => {
  productCache = null;
  cacheTimestamp = 0;
};

// GET SINGLE PRODUCT
const getProductById = async (req, res) => {
  try {

    const product = await Product.findById(
      req.params.id
    );

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
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};