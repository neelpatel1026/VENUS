const express = require("express");
const router = express.Router();
const {
  validateCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require("../controllers/couponController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const paymentLimiter = require("../middleware/paymentLimiter");
const adminLimiter = require("../middleware/adminLimiter");

router.post("/validate", paymentLimiter, validateCoupon);

router.route("/")
  .get(protect, admin, adminLimiter, getCoupons)
  .post(protect, admin, adminLimiter, createCoupon);

router.route("/:id")
  .put(protect, admin, adminLimiter, updateCoupon)
  .delete(protect, admin, adminLimiter, deleteCoupon);

module.exports = router;