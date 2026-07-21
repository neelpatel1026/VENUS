const express = require("express");

const router = express.Router();
const { admin } = require("../middleware/adminMiddleware");
const returnUpload = require("../middleware/returnUpload");
const paymentLimiter = require("../middleware/paymentLimiter");
const adminLimiter = require("../middleware/adminLimiter");

const {
  createReturnRequest,
  getMyReturns,
  getReturns,
  updateReturnStatus,
} = require("../controllers/returnController");

const { protect } = require("../middleware/authMiddleware");

const imageOptimization = require("../middleware/imageOptimization");

// router.post("/", protect, createReturnRequest);
router.post("/", protect, paymentLimiter, returnUpload.array("images", 5), imageOptimization, createReturnRequest);

router.get("/my", protect, getMyReturns);

router.get("/", protect, admin, adminLimiter, getReturns);

router.put("/:id", protect, admin, adminLimiter, updateReturnStatus);

module.exports = router;
