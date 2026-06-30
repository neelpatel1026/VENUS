const express = require('express');
const router = express.Router();

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
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


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