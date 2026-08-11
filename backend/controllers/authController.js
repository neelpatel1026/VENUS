const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail.js');
const { OAuth2Client } = require('google-auth-library');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });
};

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const options = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: parseInt(process.env.COOKIE_MAX_AGE || String(15 * 24 * 60 * 60 * 1000)),
    path: process.env.COOKIE_PATH || "/",
  };
  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }
  return options;
};



// REGISTER
const registerUser = async (req, res) => {

  try {

    const { name, email, password, phone } = req.body;

    /* ================= VALIDATIONS ================= */

    // CHECK EMPTY FIELDS
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        message: 'Please fill all fields',
      });
    }

    // NAME VALIDATION
    if (name.trim().length < 3) {
      return res.status(400).json({
        message: 'Name must be at least 3 characters',
      });
    }

    // EMAIL VALIDATION
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format',
      });
    }

    // PASSWORD VALIDATION
    if (!password || password.length < 6 || password.length > 50) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters.',
      });
    }

    // PHONE VALIDATION
    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: 'Phone number must be 10 digits',
      });
    }

    /* ================= CHECK EXISTING USER ================= */

    const userExists = await User.findOne({
      $or: [
        { email },
        { phone },
      ],
    });

    if (userExists) {

      // EMAIL ALREADY EXISTS
      if (userExists.email === email) {
        return res.status(400).json({
          message: 'Email already registered',
        });
      }

      // PHONE ALREADY EXISTS
      if (userExists.phone === phone) {
        return res.status(400).json({
          message: 'Phone number already registered',
        });
      }
    }

    /* ================= HASH PASSWORD ================= */

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    /* ================= CREATE USER ================= */

    // const user = await User.create({
    //   name: name.trim(),
    //   email: email.toLowerCase().trim(),
    //   password: hashedPassword,
    //   phone,
    // });

    const adminEmails = process.env.ADMIN_EMAILS.split(',');

const user = await User.create({
  name: name.trim(),
  email: email.toLowerCase().trim(),
  password: hashedPassword,
  phone,
  role: adminEmails.includes(
    email.toLowerCase().trim()
  )
    ? "admin" : "user",
});

    /* ================= RESPONSE ================= */
    // Send welcome email asynchronously
    const { sendWelcomeEmail } = require("../utils/notificationService.js");
    sendWelcomeEmail(user).catch((err) => {
      console.error("❌ Welcome email failed:", err.message);
    });

    const token = generateToken(user._id);

    res.cookie("token", token, getCookieOptions());

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// LOGIN WITH EMAIL OR PHONE
const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    console.log(`[AUTH DEBUG] Login request received for key: "${emailOrPhone}"`);
    console.log(`[AUTH DEBUG] Database connection status: ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);

    const user = await User.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase().trim() },
        { phone: emailOrPhone.toLowerCase().trim() },
      ],
    });

    if (!user) {
      console.warn(`[AUTH DEBUG] Login failed: User not found for key "${emailOrPhone}"`);
      return res.status(401).json({
        message: 'User not found',
      });
    }

    console.log(`[AUTH DEBUG] User record located: id=${user._id}, email=${user.email}, role=${user.role}`);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[AUTH DEBUG] Password check result: matches = ${isMatch}`);

    if (!isMatch) {
      console.warn(`[AUTH DEBUG] Login failed: Password mismatch for key "${emailOrPhone}"`);
      return res.status(401).json({
        message: 'Invalid password',
      });
    }

    const token = generateToken(user._id);
    console.log(`[AUTH DEBUG] Generated auth token for user: ${user._id}`);

    const cookieOpts = getCookieOptions();
    res.cookie("token", token, cookieOpts);
    console.log(`[AUTH DEBUG] Placed token cookie with options:`, JSON.stringify(cookieOpts));

    console.log(`[AUTH DEBUG] User successfully logged in: ${user.email}`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error(`[AUTH DEBUG] Unexpected login controller exception:`, error);
    res.status(500).json({ message: error.message });
  }
};

// GOOGLE LOGIN
const googleLogin = async (req, res) => {

  try {

    const { credential } = req.body;

    // VERIFY GOOGLE TOKEN
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { sub, email, name, email_verified } = payload;

    // CHECK VERIFIED GOOGLE EMAIL
    if (!email_verified) {
      return res.status(401).json({
        message: 'Google email not verified',
      });
    }

    // FIND EXISTING USER
    let user = await User.findOne({ email });

    // BLOCK DIRECT GOOGLE REGISTER
    if (!user) {
      return res.status(401).json({
        message: 'Please register first before Google Login',
      });
    }

    // SAVE GOOGLE ID FIRST TIME
    if (!user.googleId) {
      user.googleId = sub;
      await user.save();
    }

    const token = generateToken(user._id);

    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: 'Google login failed',
    });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = await bcrypt.hash(otp, 10);
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    const { sendForgotPasswordOtp } = require("../utils/notificationService.js");
    
    const emailStartTime = Date.now();
    sendForgotPasswordOtp(user, otp)
      .then(() => {
        console.log(`[authController] Background forgot password email sent to ${user.email} in ${Date.now() - emailStartTime} ms`);
      })
      .catch((err) => {
        console.error(`[authController] Background forgot password email failed:`, err);
      });

    return res.json({
      message: 'OTP sent to email',
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// RESET PASSWORD

const resetPassword = async (req, res) => {

  try {

    const { email, otp, newPassword } = req.body;

    /* ================= VALIDATIONS ================= */

    // CHECK EMPTY FIELDS

    if (!email || !otp || !newPassword) {

      return res.status(400).json({
        message: 'Please fill all fields',
      });
    }

    // PASSWORD VALIDATION
    if (!newPassword || newPassword.length < 6 || newPassword.length > 50) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters.',
      });
    }

    /* ================= FIND USER ================= */

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {

      return res.status(404).json({
        message: 'User not found',
      });
    }

    /* ================= OTP CHECK ================= */

    // if (String(user.otp) !== String(otp)) {

    //   return res.status(400).json({
    //     message: 'Invalid OTP',
    //   });
    // }

    /* ================= OTP CHECK ================= */

const isOtpValid = await bcrypt.compare(
  otp,
  user.otp
);

if (!isOtpValid) {

  return res.status(400).json({
    message: 'Invalid OTP',
  });
}

    /* ================= OTP EXPIRE CHECK ================= */

    if (user.otpExpire < Date.now()) {

      return res.status(400).json({
        message: 'OTP expired',
      });
    }

    /* ================= HASH PASSWORD ================= */

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(
      newPassword,
      salt
    );

    /* ================= CLEAR OTP ================= */

    user.otp = '';

    user.otpExpire = null;

    await user.save();

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, phone, password } = req.body;

    if (name) {
      if (name.trim().length < 3) {
        return res.status(400).json({ message: "Name must be at least 3 characters" });
      }
      user.name = name.trim();
    }

    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: "Phone number must be 10 digits" });
      }
      const phoneExists = await User.findOne({ phone, _id: { $ne: user._id } });
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already registered by another user" });
      }
      user.phone = phone;
    }

    if (password) {
      if (password.length < 6 || password.length > 50) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "venus-avatars",
      });
      user.avatarUrl = result.secure_url;
      const fs = require("fs");
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await user.save();
    
    const token = generateToken(updatedUser._id);
    res.cookie("token", token, getCookieOptions());

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      role: updatedUser.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const opts = getCookieOptions();
    // Clear cookie by resetting maxAge to 0
    res.clearCookie("token", { ...opts, maxAge: 0 });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getUsers,
  updateProfile,
  logoutUser
};

