const Coupon = require("../models/Coupon");
const Product = require("../models/Product");

// Helper function to validate coupon rules
const checkCouponValidity = async (coupon, cartItems, userId) => {
  const now = new Date();

  // 1. Check if exists & active
  if (!coupon || !coupon.active) {
    return { valid: false, message: "Invalid or inactive coupon code" };
  }

  // 2. Check start date
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    return { valid: false, message: "This coupon promotion has not started yet" };
  }

  // 3. Check expiry date
  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
    return { valid: false, message: "This coupon code has expired" };
  }

  // 4. Check if cart is empty
  if (!cartItems || cartItems.length === 0) {
    return { valid: false, message: "Your cart is empty" };
  }

  // 5. Calculate subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (subtotal <= 0) {
    return { valid: false, message: "Cart total must be greater than zero to apply coupon" };
  }

  // 6. Check minimum order value
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return { valid: false, message: `Minimum order value of ₹${coupon.minOrderValue} is required for this coupon` };
  }

  // 7. Check total usage limit
  if (coupon.usageLimit > 0 && coupon.totalUsage >= coupon.usageLimit) {
    return { valid: false, message: "Coupon maximum usage limit has been reached" };
  }

  // 8. Check per user usage limit
  if (userId && coupon.perUserLimit > 0) {
    const Order = require("../models/Order");
    const userUsageCount = await Order.countDocuments({
      userId,
      couponCode: coupon.code,
      status: { $ne: "Cancelled" }
    });
    if (userUsageCount >= coupon.perUserLimit) {
      return { valid: false, message: "You have already used this coupon code" };
    }
  }

  // 9. First order only check
  if (userId && (coupon.firstOrderOnly || coupon.newUserOnly)) {
    const Order = require("../models/Order");
    const previousOrdersCount = await Order.countDocuments({
      userId,
      status: { $ne: "Cancelled" }
    });
    if (previousOrdersCount > 0) {
      return { valid: false, message: "This coupon is only applicable for your first order" };
    }
  }

  // 10. Product & Category restrictions check
  let validProductsCount = 0;
  for (const item of cartItems) {
    let matchesProduct = true;
    let matchesCategory = true;

    // Check applicable products
    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      matchesProduct = coupon.applicableProducts.some(pId => pId.toString() === (item.productId || item._id).toString());
    }

    // Check excluded products
    if (coupon.excludedProducts && coupon.excludedProducts.length > 0) {
      if (coupon.excludedProducts.some(pId => pId.toString() === (item.productId || item._id).toString())) {
        matchesProduct = false;
      }
    }

    // Check applicable categories
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const dbProduct = await Product.findById(item.productId || item._id);
      if (dbProduct && dbProduct.category) {
        matchesCategory = coupon.applicableCategories.some(cat => cat.toLowerCase() === dbProduct.category.toLowerCase());
      } else {
        matchesCategory = false;
      }
    }

    if (matchesProduct && matchesCategory) {
      validProductsCount++;
    }
  }

  if (validProductsCount === 0) {
    return { valid: false, message: "This coupon is not applicable to the items in your cart" };
  }

  return { valid: true };
};

// Helper function to calculate final coupon discount
const calculateCouponDiscount = (coupon, cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  if (subtotal <= 0) return 0;

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discount) / 100;
    if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === "fixed") {
    discount = coupon.discount;
  }

  if (discount > subtotal) {
    discount = subtotal;
  }

  return parseFloat(Math.max(0, discount).toFixed(2));
};

const validateCoupon = async (req, res) => {
  try {
    const { code, items } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid coupon code" });
    }

    // Run business logic check
    const userId = req.user ? req.user._id : null;
    const validation = await checkCouponValidity(coupon, items || [], userId);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const discountAmount = calculateCouponDiscount(coupon, items || []);

    res.json({
      success: true,
      message: "Coupon Applied Successfully",
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discount,
      discountAmount,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      discountType,
      discount,
      startDate,
      expiryDate,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perUserLimit,
      active,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      firstOrderOnly,
      newUserOnly,
      loggedInOnly,
      singleUsePerOrder,
      autoApply,
      featured,
      stackable,
      allowCombination,
      priority,
      notes
    } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    if (new Date(expiryDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be before start date" });
    }

    if (discount <= 0) {
      return res.status(400).json({ success: false, message: "Discount value must be positive" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discount,
      startDate,
      expiryDate,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perUserLimit,
      active,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      firstOrderOnly,
      newUserOnly,
      loggedInOnly,
      singleUsePerOrder,
      autoApply,
      featured,
      stackable,
      allowCombination,
      priority,
      createdBy: req.user ? req.user._id : null,
      notes
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const {
      code,
      description,
      discountType,
      discount,
      startDate,
      expiryDate,
      minOrderValue,
      maxDiscount,
      usageLimit,
      perUserLimit,
      active,
      applicableCategories,
      applicableProducts,
      excludedProducts,
      applicableBrands,
      firstOrderOnly,
      newUserOnly,
      loggedInOnly,
      singleUsePerOrder,
      autoApply,
      featured,
      stackable,
      allowCombination,
      priority,
      notes
    } = req.body;

    if (code) coupon.code = code.toUpperCase();
    if (description !== undefined) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discount !== undefined) {
      if (discount <= 0) {
        return res.status(400).json({ success: false, message: "Discount value must be positive" });
      }
      coupon.discount = discount;
    }
    if (startDate) coupon.startDate = startDate;
    if (expiryDate) coupon.expiryDate = expiryDate;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (perUserLimit !== undefined) coupon.perUserLimit = perUserLimit;
    if (active !== undefined) coupon.active = active;
    if (applicableCategories) coupon.applicableCategories = applicableCategories;
    if (applicableProducts) coupon.applicableProducts = applicableProducts;
    if (excludedProducts) coupon.excludedProducts = excludedProducts;
    if (applicableBrands) coupon.applicableBrands = applicableBrands;
    if (firstOrderOnly !== undefined) coupon.firstOrderOnly = firstOrderOnly;
    if (newUserOnly !== undefined) coupon.newUserOnly = newUserOnly;
    if (loggedInOnly !== undefined) coupon.loggedInOnly = loggedInOnly;
    if (singleUsePerOrder !== undefined) coupon.singleUsePerOrder = singleUsePerOrder;
    if (autoApply !== undefined) coupon.autoApply = autoApply;
    if (featured !== undefined) coupon.featured = featured;
    if (stackable !== undefined) coupon.stackable = stackable;
    if (allowCombination !== undefined) coupon.allowCombination = allowCombination;
    if (priority !== undefined) coupon.priority = priority;
    if (notes !== undefined) coupon.notes = notes;

    if (new Date(coupon.expiryDate) < new Date(coupon.startDate)) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be before start date" });
    }

    await coupon.save();
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }
    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  checkCouponValidity,
  calculateCouponDiscount
};