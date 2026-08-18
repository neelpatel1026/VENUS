const express = require("express");
const router = express.Router();
const { admin } = require("../middleware/adminMiddleware");
const returnUpload = require("../middleware/returnUpload");
const paymentLimiter = require("../middleware/paymentLimiter");
const adminLimiter = require("../middleware/adminLimiter");
const { protect } = require("../middleware/authMiddleware");

const {
  getOrderForReturn,
  createReturnRequest,
  getMyReturns,
  getReturns,
  approveReturnAndCreatePickup,
  markProductReceived,
  performQualityCheck,
  processRefund,
  rejectReturn,
  handleCourierWebhook,
  updateReturnStatus,
} = require("../controllers/returnController");

// Customer routes
router.get("/order/:orderId", protect, getOrderForReturn);
router.post("/", protect, paymentLimiter, returnUpload.array("images", 5), createReturnRequest);
router.get("/my", protect, getMyReturns);

// Admin workflow routes
router.get("/", protect, admin, adminLimiter, getReturns);
router.post("/:id/approve", protect, admin, adminLimiter, approveReturnAndCreatePickup);
router.put("/:id/receive", protect, admin, adminLimiter, markProductReceived);
router.post("/:id/quality-check", protect, admin, adminLimiter, performQualityCheck);
router.post("/:id/refund", protect, admin, adminLimiter, paymentLimiter, processRefund);
router.post("/:id/reject", protect, admin, adminLimiter, rejectReturn);
router.put("/:id", protect, admin, adminLimiter, updateReturnStatus);

// Courier logistics webhook
router.post("/courier/webhook", handleCourierWebhook);

module.exports = router;
