const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const sendEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const email = user.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // Rate limiting / Spam prevention (rolling 1-hour window)
    const now = Date.now();
    if (!user.otpSendResetTime || user.otpSendResetTime < now) {
      user.otpSendCount = 0;
      user.otpSendResetTime = now + 60 * 60 * 1000; // 1 hour window
    }

    if (user.otpSendCount >= 5) {
      const waitTimeMins = Math.ceil((user.otpSendResetTime - now) / (60 * 1000));
      return res.status(429).json({
        success: false,
        message: `Maximum resend attempts reached. Please try again after ${waitTimeMins} minutes.`,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store securely (hashed representation)
    user.emailOtp = await bcrypt.hash(otp, 10);
    user.emailOtpExpire = now + 10 * 60 * 1000; // 10 minutes expiry
    user.emailVerified = false;
    user.otpSendCount += 1;

    await user.save();
    console.log(`[emailOtpController] OTP generated and saved in DB for user: ${user._id}`);

    const { sendEmailVerificationOtp } = require("../utils/notificationService.js");
    
    // Await delivery to verify Resend API connection state immediately
    try {
      await sendEmailVerificationOtp(user, otp);
      console.log(`[emailOtpController] Email delivered successfully to ${email}`);
      return res.json({
        success: true,
        message: "OTP sent to email",
        resendAttemptsLeft: 5 - user.otpSendCount,
      });
    } catch (emailErr) {
      console.error(`[emailOtpController] Nodemailer send failed:`, emailErr);
      
      // Rollback DB states on immediate SMTP connection errors so user is not penalized
      user.otpSendCount = Math.max(0, user.otpSendCount - 1);
      user.emailOtp = "";
      user.emailOtpExpire = null;
      await user.save();

      return res.status(500).json({
        success: false,
        message: `SMTP delivery failed: ${emailErr.message}`,
      });
    }
  } catch (error) {
    console.error(`[emailOtpController] Send OTP handler error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists / has been used
    if (!user.emailOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP already used",
      });
    }

    // Expiry verification
    if (!user.emailOtpExpire || user.emailOtpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Hash comparison
    const valid = await bcrypt.compare(otp, user.emailOtp);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP",
      });
    }

    // Verified state update - delete OTP fields to prevent replay
    user.emailVerified = true;
    user.emailOtp = "";
    user.emailOtpExpire = null;
    user.otpAttempts = 0; // reset failed attempts if tracked

    await user.save();

    return res.json({
      success: true,
      message: "OTP verification successful",
    });
  } catch (error) {
    console.error(`[emailOtpController] Verify OTP handler error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
};
