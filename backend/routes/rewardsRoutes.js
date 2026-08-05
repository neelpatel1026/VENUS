const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const adminLimiter = require("../middleware/adminLimiter");
const {
  getUserWalletDetails,
  adjustUserCoins,
  freezeUserWallet,
  unfreezeUserWallet,
  getAdminRewardsDashboard
} = require("../controllers/rewardsController");

const router = express.Router();

// User routes
router.route("/wallet").get(protect, getUserWalletDetails);

// Admin routes
router.route("/admin/dashboard").get(protect, admin, adminLimiter, getAdminRewardsDashboard);
router.route("/admin/adjust").post(protect, admin, adminLimiter, adjustUserCoins);
router.route("/admin/freeze").post(protect, admin, adminLimiter, freezeUserWallet);
router.route("/admin/unfreeze").post(protect, admin, adminLimiter, unfreezeUserWallet);

module.exports = router;
