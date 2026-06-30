const express = require("express");

const router = express.Router();

const { protect } =
require("../middleware/authMiddleware");

const {
  sendEmailOtp,
  verifyEmailOtp,
} = require("../controllers/emailOtpController");

router.post("/send", protect, sendEmailOtp);

router.post("/verify", protect, verifyEmailOtp);

module.exports = router;