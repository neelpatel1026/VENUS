const User = require("../models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail");

const sendEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailOtp = await bcrypt.hash(otp, 10);

    const startTime = Date.now();
    console.log(`[emailOtpController] Send OTP request received for user: ${req.user._id}`);

    user.emailOtpExpire = Date.now() + 5 * 60 * 1000;
    user.emailVerified = false;

    await user.save();
    console.log(`[emailOtpController] OTP hashed and saved in DB in ${Date.now() - startTime} ms`);

    const { sendEmailVerificationOtp } = require("../utils/notificationService.js");
    
    // Dispatch email dispatch asynchronously without blocking the client response
    const emailStartTime = Date.now();
    sendEmailVerificationOtp(user, otp)
      .then(() => {
        console.log(`[emailOtpController] Background email delivered successfully to ${user.email} in ${Date.now() - emailStartTime} ms`);
      })
      .catch((err) => {
        console.error(`[emailOtpController] Background email delivery failed:`, err);
      });

    console.log(`[emailOtpController] HTTP Response returned in ${Date.now() - startTime} ms`);
    return res.json({
      success: true,
      message: "OTP sent to email",
    });
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

    // const user = await User.findById(req.user._id);
    // const valid = await bcrypt.compare(otp, user.emailOtp);

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.emailOtpExpire || user.emailOtpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const valid = await bcrypt.compare(otp, user.emailOtp);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.emailVerified = true;
    user.emailOtp = "";
    user.emailOtpExpire = null;

    await user.save();

    res.json({
      success: true,
      message: "Email verified",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
};
