const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail.js');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15d',
  });
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
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

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
    const user = await User.findOne({
      $or: [
        { email: emailOrPhone.toLowerCase().trim() },
        { phone: emailOrPhone.toLowerCase().trim() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid password',
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token,
    });
  } catch (error) {
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

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

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
    // user.otp = otp;
    user.otp = await bcrypt.hash(otp, 10);

    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

//     await sendEmail({
//       email,
//       subject: 'Password Reset OTP',
//       message: `
//     <h2>Your OTP is ${otp}</h2>
//     <p>This OTP will expire in 5 minutes.</p>
//     <p>If you did not request this password reset, please ignore this email.</p> `,
//     });
    
//     if (!emailResult.success) {
//   return res.status(500).json({
//     message: "Failed to send OTP email",
//   });
// }  

    const { sendForgotPasswordOtp } = require("../utils/notificationService.js");
    try {
      await sendForgotPasswordOtp(user, otp);
    } catch (otpErr) {
      return res.status(500).json({
        message: "Failed to send OTP email: " + otpErr.message,
      });
    }

    res.json({
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

    if (newPassword.length < 6) {

      return res.status(400).json({
        message:
          'Password must be at least 6 characters',
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

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getUsers,
};

