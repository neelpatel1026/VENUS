const express = require('express');
const { getAdminStats, getAdminSearch } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/', protect, admin, getAdminStats);
router.get('/search', protect, admin, getAdminSearch);

module.exports = router;

