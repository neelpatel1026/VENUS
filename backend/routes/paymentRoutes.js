const express = require('express');
const { createOrder, verifyPayment, refundPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.post('/order', createOrder);
router.post('/verify', verifyPayment);
router.post('/refund/:id', protect, admin, refundPayment);

module.exports = router;