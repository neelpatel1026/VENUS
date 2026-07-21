const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController.js');
const { protect } = require('../middleware/authMiddleware.js');
const { admin } = require('../middleware/adminMiddleware.js');
const adminLimiter = require("../middleware/adminLimiter");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const imageOptimization = require('../middleware/imageOptimization.js');

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, adminLimiter, upload.single('image'), imageOptimization, createProduct);
router.route('/:id').get(getProductById).put(protect, admin, adminLimiter, upload.single('image'), imageOptimization, updateProduct).delete(protect, admin, adminLimiter, deleteProduct);

module.exports = router;