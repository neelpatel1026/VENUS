const express = require('express');
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    message: "Too many authentication requests from this IP, please try again after 15 minutes."
  }
});

const {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
  getUsers,
} = require('../controllers/authController.js');

// const authMiddleware = require('../middleware/authMiddleware.js');
const { protect } = require('../middleware/authMiddleware.js');
const User = require('../models/User.js');

router.get("/users", getUsers);
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google-login', authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);


// GET CURRENT LOGGED IN USER
// router.get('/me', authMiddleware, async (req, res) => {
  router.get('/me', protect, async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });

  }

});

module.exports = router;