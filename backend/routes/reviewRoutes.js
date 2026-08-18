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

// Real file upload to Cloudinary for reviews (allow guest upload)
const returnUpload = require("../middleware/returnUpload");
const cloudinary = require("../config/cloudinary");
router.post("/upload", returnUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const resourceType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    const uploadFromBuffer = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "venus-reviews", resource_type: resourceType },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };
    const uploadResult = await uploadFromBuffer(req.file.buffer);
    res.status(200).json({ 
      url: uploadResult.secure_url,
      secure_url: uploadResult.secure_url,
      type: resourceType,
      public_id: uploadResult.public_id
    });
  } catch (error) {
    console.error("🔴 Cloudinary review upload error:", error);
    res.status(500).json({ message: "Upload failed: " + error.message });
  }
});

const { reviewSubmitLimiter } = require("../middleware/authLimiter");
router.post("/", reviewSubmitLimiter, createReview);

// Private/customer routes
router.use(protect);
router.get("/check-eligibility", checkEligibility);
router.get("/myreviews", getMyReviews);
router.put("/:id", reviewSubmitLimiter, editReview);
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
