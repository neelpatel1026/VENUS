const express = require('express');
const { createOrder, verifyPayment, refundPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const paymentLimiter = require("../middleware/paymentLimiter");
const adminLimiter = require("../middleware/adminLimiter");

const router = express.Router();

router.post('/order', paymentLimiter, createOrder);
router.post('/verify', paymentLimiter, verifyPayment);
router.post('/refund/:id', protect, admin, adminLimiter, refundPayment);

module.exports = router;