const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const otpLimiter = require("../middleware/otpLimiter");
const authLimiter = require("../middleware/authLimiter");

const {
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/emailOtpController");

router.post("/send", protect, otpLimiter, sendEmailOtp);
router.post("/verify", protect, authLimiter, verifyEmailOtp);

module.exports = router;