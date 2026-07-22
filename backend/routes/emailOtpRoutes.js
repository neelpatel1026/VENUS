const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const otpLimiter = require("../middleware/otpLimiter");
const { verifyOtpLimiter } = require("../middleware/authLimiter");

const {
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/emailOtpController");

router.post("/send", protect, otpLimiter, sendEmailOtp);
router.post("/verify", protect, verifyOtpLimiter, verifyEmailOtp);

module.exports = router;