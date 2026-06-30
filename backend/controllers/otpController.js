const User = require("../models/User");
const bcrypt = require("bcryptjs");

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// =========================
// SEND OTP
// =========================

const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number required",
      });
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number",
      });
    }

    // const user = await User.findOne({ phone });
    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "User not found",
    //   });
    // }

    // if (user.otpSendResetTime && user.otpSendResetTime > Date.now()) {
    //   if (user.otpSendCount >= 5) {
    //     return res.status(429).json({
    //       success: false,
    //       message: "Too many OTP requests. Try again later.",
    //     });
    //   }
    // } else {
    //   user.otpSendCount = 0;
    // }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otpSendResetTime && user.otpSendResetTime > Date.now()) {
      if (user.otpSendCount >= 5) {
        return res.status(429).json({
          success: false,
          message: "Too many OTP requests. Try again later.",
        });
      }
    } else {
      user.otpSendCount = 0;
    }

    // if (!user) {
    //   return res.status(404).json({
    //     success: false,
    //     message: "User not found",
    //   });
    // }

    const otp = generateOtp();

    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;

    user.otpExpire = Date.now() + 5 * 60 * 1000;

    user.otpVerified = false;
    user.otpSendCount += 1;

    user.otpSendResetTime = Date.now() + 60 * 60 * 1000;

    await user.save();
    console.log("OTP VERIFIED SAVED:", user.otpVerified);

    const freshUser = await User.findById(user._id);

    console.log("MONGO OTP VERIFIED:", freshUser.otpVerified);

    console.log("OTP:", otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// =========================
// VERIFY OTP
// =========================

const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // const user = await User.findOne({ phone });
    // if (user.otpAttempts >= 5) {
    //   return res.status(429).json({
    //     success: false,
    //     message: "Too many failed attempts. Request a new OTP.",
    //   });
    // }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Request a new OTP.",
      });
    }

    if (!user.otpExpire || user.otpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const isValid = await bcrypt.compare(otp, user.otp);

    // if (!isValid) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid OTP",
    //   });
    // }

    if (!isValid) {
      user.otpAttempts += 1;

      await user.save();

      if (user.otpAttempts >= 5) {
        return res.status(429).json({
          success: false,
          message: "Maximum OTP attempts reached",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // user.otp = "";
    // user.otpExpire = null;
    // user.otpVerified = true;
    // user.otp = "";
    // user.otpExpire = null;
    // user.otpVerified = true;
    // user.otpAttempts = 0;

    // await user.save();

    user.otp = "";
    user.otpExpire = null;
    user.otpVerified = true;
    user.otpAttempts = 0;

    await user.save();

    console.log("OTP VERIFIED SAVED:", user.otpVerified);

    const freshUser = await User.findById(user._id);

    console.log("MONGO OTP VERIFIED:", freshUser.otpVerified);

    res.status(200).json({
      success: true,
      message: "OTP verified",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};
