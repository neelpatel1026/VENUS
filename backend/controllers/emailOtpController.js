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

    user.emailOtpExpire = Date.now() + 5 * 60 * 1000;

    user.emailVerified = false;

    await user.save();

    await sendEmail({
      email: user.email,
      subject: "COD Verification OTP",
      message: `
      <h2>Your OTP is ${otp}</h2>
      <p>Valid for 5 minutes</p>
      `,
    });

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    res.status(500).json({
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
