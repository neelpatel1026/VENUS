const Coupon = require("../models/Coupon");

const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      active: true,
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon",
      });
    }

    if (coupon.expiryDate < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Coupon expired",
      });
    }

    res.json({
      success: true,
      discount: coupon.discount,
      code: coupon.code,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  validateCoupon,
};