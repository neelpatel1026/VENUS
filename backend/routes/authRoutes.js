const express = require('express');
const router = express.Router();

const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require("../middleware/authLimiter");

const {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getUsers,
} = require('../controllers/authController.js');

const { protect } = require('../middleware/authMiddleware.js');
const User = require('../models/User.js');

router.get("/users", getUsers);
router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);

// GET CURRENT LOGGED IN USER
router.get('/me', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message,
    });
  }
});

module.exports = router;