



const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// GET ALL PRODUCTS
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 });

    res.status(200).json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
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
    });

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

    if (
  price !== undefined &&
  Number(price) < 0
) {
  return res.status(400).json({
    message: "Price cannot be negative"
  });
}

if (
  originalPrice !== undefined &&
  Number(originalPrice) < 0
) {
  return res.status(400).json({
    message: "Original Price cannot be negative"
  });
}

if (
  price !== undefined &&
  originalPrice !== undefined &&
  Number(originalPrice) < Number(price)
) {
  return res.status(400).json({
    message: "Original Price must be greater than or equal to Price"
  });
}

    if (price !== undefined)
  product.price = price;

if (originalPrice !== undefined)
  product.originalPrice = originalPrice;

    if (name) product.name = name.trim();

    if (description)
      product.description = description.trim();

    if (category)
      product.category = category;

    if (stock !== undefined)
      product.stock = stock;

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