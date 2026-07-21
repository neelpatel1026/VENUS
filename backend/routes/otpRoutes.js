const express = require("express");
const router = express.Router();
const otpLimiter = require("../middleware/otpLimiter");
const authLimiter = require("../middleware/authLimiter");

const {
  sendOtp,
  verifyOtp,
} = require("../controllers/otpController");

router.post("/send", otpLimiter, sendOtp);
router.post("/verify", authLimiter, verifyOtp);

module.exports = router;