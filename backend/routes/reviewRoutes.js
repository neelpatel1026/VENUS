const express = require("express");
const {
  createReview,
  editReview,
  deleteReview,
  getProductReviews,
  voteHelpful,
  voteUnhelpful,
  reportReview,
  checkEligibility,
  adminGetReviews,
  adminToggleVisibility,
  adminDeleteReview,
  adminReplyReview,
  getMyReviews,
  getReviewCampaignStats,
} = require("../controllers/reviewController.js");
const { protect } = require("../middleware/authMiddleware.js");
const { admin } = require("../middleware/adminMiddleware.js");

const router = express.Router();

// Public routes
router.get("/product/:productId", getProductReviews);

// Private/customer routes
router.use(protect);
router.get("/check-eligibility", checkEligibility);
router.get("/myreviews", getMyReviews);
router.post("/", createReview);
router.put("/:id", editReview);
router.delete("/:id", deleteReview);
router.post("/:id/helpful", voteHelpful);
router.post("/:id/unhelpful", voteUnhelpful);
router.post("/:id/report", reportReview);

// Admin routes
const adminLimiter = require("../middleware/adminLimiter");
router.use(admin);
router.get("/admin", adminLimiter, adminGetReviews);
router.get("/admin/campaign-stats", adminLimiter, getReviewCampaignStats);
router.put("/admin/:id/visibility", adminLimiter, adminToggleVisibility);
router.delete("/admin/:id", adminLimiter, adminDeleteReview);
router.post("/admin/:id/reply", adminLimiter, adminReplyReview);

module.exports = router;
