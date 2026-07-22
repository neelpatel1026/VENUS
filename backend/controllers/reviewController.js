const Review = require("../models/Review.js");
const Product = require("../models/Product.js");
const Order = require("../models/Order.js");
const mongoose = require("mongoose");

// Helper function to recalculate Product Rating statistics
const updateProductRatingStats = async (productId) => {
  try {
    const stats = await Review.aggregate([
      { $match: { productId: productId, isHidden: false } },
      {
        $group: {
          _id: "$productId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      // Round average rating to 1 decimal place (e.g. 4.7)
      const roundedAvg = Math.round(stats[0].avgRating * 10) / 10;
      await Product.findByIdAndUpdate(productId, {
        rating: roundedAvg,
        reviewCount: stats[0].reviewCount,
      });
    } else {
      // Default fallback if no reviews left
      await Product.findByIdAndUpdate(productId, {
        rating: 4.8,
        reviewCount: 0,
      });
    }
  } catch (error) {
    console.error("❌ Failed to update product rating stats:", error.message);
  }
};

/**
 * @desc    Submit a review for a product
 * @route   POST /api/reviews
 * @access  Private
 */
const createReview = async (req, res) => {
  try {
    const { productId, orderId, rating, title, review, images, video, location, variant, recommend, isAnonymous, skinType, ageGroup, pros, cons } = req.body;
    const userId = req.user._id;

    // 1. Validation
    if (!productId || !orderId || !rating || !title || !review) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (review.trim().length < 20 || review.trim().length > 1000) {
      return res.status(400).json({ message: "Review must be between 20 and 1000 characters" });
    }

    // 2. Verify Order exists, belongs to user, and is Delivered
    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({ message: "You can only review delivered products" });
    }

    // 3. Verify Product is in the order items
    const matchingItem = order.items.find(
      (item) => item.productId.toString() === productId.toString()
    );
    if (!matchingItem) {
      return res.status(400).json({ message: "Product is not part of this order" });
    }

    // 4. Verify user hasn't already reviewed this product for this order
    const existingReview = await Review.findOne({ productId, userId, orderId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product for this order" });
    }

    // 5. Create Review
    const finalVariant = variant || matchingItem.variant || "Standard Edition";
    const displayName = isAnonymous ? "Anonymous" : req.user.name;
    const newReview = new Review({
      productId,
      userId,
      orderId,
      customerName: displayName,
      rating,
      title: title.trim(),
      review: review.trim(),
      isVerifiedPurchase: true,
      images: Array.isArray(images) ? images : [],
      video: typeof video === "string" ? video : "",
      location: typeof location === "string" ? location : "",
      variant: finalVariant,
      recommend: recommend !== false,
      isAnonymous: isAnonymous === true,
      skinType: typeof skinType === "string" ? skinType : "",
      ageGroup: typeof ageGroup === "string" ? ageGroup : "",
      pros: typeof pros === "string" ? pros : "",
      cons: typeof cons === "string" ? cons : "",
      isHidden: false,
    });

    const savedReview = await newReview.save();

    // 6. Check if all items in order have been reviewed to complete campaign
    let allReviewed = true;
    for (const item of order.items) {
      const rev = await Review.findOne({ productId: item.productId, userId });
      if (!rev) {
        allReviewed = false;
        break;
      }
    }
    if (allReviewed) {
      order.reviewCampaignCompleted = true;
      await order.save();
    }

    // 7. Recalculate rating aggregates on the Product
    await updateProductRatingStats(productId);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! Thank you.",
      review: savedReview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Edit an existing review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const editReview = async (req, res) => {
  try {
    const { rating, title, review, images, video, location, variant, recommend, isAnonymous, skinType, ageGroup, pros, cons } = req.body;
    const reviewId = req.params.id;
    const userId = req.user._id;

    const reviewObj = await Review.findOne({ _id: reviewId, userId });
    if (!reviewObj) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    // Restrict edits to 30 days
    const diffTime = Math.abs(new Date() - new Date(reviewObj.createdAt));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      return res.status(400).json({ message: "Reviews cannot be modified after 30 days" });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    if (review && (review.trim().length < 20 || review.trim().length > 1000)) {
      return res.status(400).json({ message: "Review must be between 20 and 1000 characters" });
    }

    if (rating) reviewObj.rating = rating;
    if (title) reviewObj.title = title.trim();
    if (review) reviewObj.review = review.trim();
    if (Array.isArray(images)) reviewObj.images = images;
    if (typeof video === "string") reviewObj.video = video;
    if (typeof location === "string") reviewObj.location = location;
    if (typeof variant === "string") reviewObj.variant = variant;
    if (typeof recommend === "boolean") reviewObj.recommend = recommend;
    if (typeof isAnonymous === "boolean") {
      reviewObj.isAnonymous = isAnonymous;
      reviewObj.customerName = isAnonymous ? "Anonymous" : req.user.name;
    }
    if (typeof skinType === "string") reviewObj.skinType = skinType;
    if (typeof ageGroup === "string") reviewObj.ageGroup = ageGroup;
    if (typeof pros === "string") reviewObj.pros = pros;
    if (typeof cons === "string") reviewObj.cons = cons;
    
    reviewObj.edited = true;

    const updatedReview = await reviewObj.save();

    // Recalculate rating aggregates on the Product
    await updateProductRatingStats(reviewObj.productId);

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get reviews for a product (with sorting, breakdown, pagination)
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
const getProductReviews = async (req, res) => {
  try {
        const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const sort = req.query.sort || "newest";
    const ratingFilter = req.query.rating; // e.g., "5", "4" etc.
    const mediaFilter = req.query.media; // "photos", "videos", "any"
    const verifiedFilter = req.query.verified; // "true"
    const searchFilter = req.query.search; // search query string
    const skinTypeFilter = req.query.skinType;
    const ageGroupFilter = req.query.ageGroup;

    const skipIndex = (page - 1) * limit;

    // 1. Build Query Filters
    const query = { productId, isHidden: false };

    if (ratingFilter) {
      query.rating = parseInt(ratingFilter);
    }

    if (verifiedFilter === "true") {
      query.isVerifiedPurchase = true;
    }

    if (skinTypeFilter) {
      query.skinType = skinTypeFilter;
    }

    if (ageGroupFilter) {
      query.ageGroup = ageGroupFilter;
    }

    if (mediaFilter === "photos") {
      query.images = { $exists: true, $not: { $size: 0 } };
    } else if (mediaFilter === "videos") {
      query.video = { $exists: true, $ne: "" };
    } else if (mediaFilter === "any") {
      query.$or = [
        { images: { $exists: true, $not: { $size: 0 } } },
        { video: { $exists: true, $ne: "" } }
      ];
    }

    if (searchFilter) {
      const searchRegex = { $regex: searchFilter, $options: "i" };
      if (query.$or) {
        // combine media filter and search filter
        query.$and = [
          { $or: query.$or },
          { $or: [ { title: searchRegex }, { review: searchRegex } ] }
        ];
        delete query.$or;
      } else {
        query.$or = [
          { title: searchRegex },
          { review: searchRegex }
        ];
      }
    }

    // Define sort rules
    let sortQuery = { createdAt: -1 };
    if (sort === "highest") {
      sortQuery = { rating: -1, createdAt: -1 };
    } else if (sort === "lowest") {
      sortQuery = { rating: 1, createdAt: -1 };
    } else if (sort === "helpful") {
      sortQuery = { helpfulCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortQuery = { createdAt: 1 };
    }

    // Fetch reviews with query filter
    const reviews = await Review.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(skipIndex);

    const totalReviews = await Review.countDocuments(query);

    // Calculate rating breakdowns (always calculate on all reviews of product, ignoring active page filters for summary)
    const breakdown = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), isHidden: false } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    const starsBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRatings = 0;
    let allReviewsCount = 0;
    breakdown.forEach((item) => {
      starsBreakdown[item._id] = item.count;
      sumRatings += item._id * item.count;
      allReviewsCount += item.count;
    });

    const averageRating = allReviewsCount > 0 ? Math.round((sumRatings / allReviewsCount) * 10) / 10 : 0;

    // Calculate recommendation percentage and verified buyer counts
    const recommendCount = await Review.countDocuments({ productId, isHidden: false, recommend: true });
    const recommendRate = allReviewsCount > 0 ? Math.round((recommendCount / allReviewsCount) * 100) : 0;
    const verifiedCount = await Review.countDocuments({ productId, isHidden: false, isVerifiedPurchase: true });

    // Fetch Featured Reviews (Positive, Critical, Latest)
    const topPositiveReview = await Review.findOne({ productId, isHidden: false, rating: { $gte: 4 } })
      .sort({ helpfulCount: -1, rating: -1 })
      .limit(1);
    
    const topCriticalReview = await Review.findOne({ productId, isHidden: false, rating: { $lte: 2 } })
      .sort({ helpfulCount: -1, rating: 1 })
      .limit(1);

    const latestReview = await Review.findOne({ productId, isHidden: false })
      .sort({ createdAt: -1 })
      .limit(1);

    // Fetch Customer Photo Gallery (up to 10 latest photos/videos)
    const customerGallery = await Review.find({
      productId,
      isHidden: false,
      $or: [
        { images: { $exists: true, $not: { $size: 0 } } },
        { video: { $exists: true, $ne: "" } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("images video customerName rating title review createdAt");

    // Dynamic Review Highlight Chips Count
    const allReviewsText = await Review.find({ productId, isHidden: false }).select("review");
    const chipsConfig = [
      { label: "Long Lasting", keywords: ["long", "last", "hour", "day"] },
      { label: "Great Packaging", keywords: ["packag", "box", "bottle", "premium"] },
      { label: "Worth Buying", keywords: ["worth", "buy", "value", "price", "money"] },
      { label: "Premium Fragrance", keywords: ["fragran", "smell", "scent", "aroma"] },
      { label: "Fast Delivery", keywords: ["deliv", "fast", "quick", "ship"] },
      { label: "Hydrating Cleanse", keywords: ["hydrat", "clean", "wash", "moistur"] },
      { label: "Highly Recommend", keywords: ["recommend", "love", "best", "great"] },
    ];

    const computedChips = chipsConfig
      .map(c => {
        let count = 0;
        allReviewsText.forEach(r => {
          const text = (r.review || "").toLowerCase();
          if (c.keywords.some(k => text.includes(k))) {
            count++;
          }
        });
        return { label: c.label, count };
      })
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5 highlights

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        pages: Math.ceil(totalReviews / limit),
      },
      stats: {
        averageRating,
        totalReviews: allReviewsCount,
        breakdown: starsBreakdown,
        recommendRate,
        verifiedCount,
      },
      customerGallery,
      highlights: computedChips,
      featured: {
        topPositiveReview,
        topCriticalReview,
        latestReview,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Vote a review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
const voteHelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user already voted helpful
    const hasVoted = review.helpfulUsers.includes(userId);
    if (hasVoted) {
      return res.status(400).json({ message: "You have already voted this review as helpful" });
    }

    review.helpfulUsers.push(userId);
    review.helpfulCount += 1;
    
    // Remove from unhelpful if they had voted unhelpful before
    if (review.unhelpfulUsers.includes(userId)) {
      review.unhelpfulUsers = review.unhelpfulUsers.filter(id => id.toString() !== userId.toString());
      review.unhelpfulCount = Math.max(0, review.unhelpfulCount - 1);
    }
    
    await review.save();

    res.status(200).json({
      success: true,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Vote a review as unhelpful
 * @route   POST /api/reviews/:id/unhelpful
 * @access  Private
 */
const voteUnhelpful = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if user already voted unhelpful
    const hasVoted = review.unhelpfulUsers.includes(userId);
    if (hasVoted) {
      return res.status(400).json({ message: "You have already voted this review as unhelpful" });
    }

    review.unhelpfulUsers.push(userId);
    review.unhelpfulCount += 1;

    // Remove from helpful if they had voted helpful before
    if (review.helpfulUsers.includes(userId)) {
      review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId.toString());
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Check if a user is eligible to review a product
 * @route   GET /api/reviews/check-eligibility
 * @access  Private
 */
const checkEligibility = async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Find any delivered orders containing this product
    const orders = await Order.find({
      userId,
      status: "Delivered",
      "items.productId": productId,
    });

    if (orders.length === 0) {
      return res.json({ eligible: false, message: "You must purchase and receive this product before reviewing" });
    }

    // Check if any of these orders don't have a review yet for this product
    let eligibleOrder = null;
    for (const order of orders) {
      const alreadyReviewed = await Review.findOne({
        productId,
        userId,
        orderId: order._id,
      });

      if (!alreadyReviewed) {
        eligibleOrder = order;
        break;
      }
    }

    if (eligibleOrder) {
      res.json({ eligible: true, orderId: eligibleOrder._id });
    } else {
      res.json({ eligible: false, message: "You have already reviewed this product for your purchases" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get reviews written by the logged in user
 * @route   GET /api/reviews/myreviews
 * @access  Private
 */
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id });
    res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==========================================================================
   ADMIN CONSOLE ENDPOINTS
   ========================================================================== */

/**
 * @desc    Get all reviews (for Admin moderation Console)
 * @route   GET /api/reviews/admin
 * @access  Private/Admin
 */
const adminGetReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { search, rating, status, productId } = req.query;

    const skipIndex = (page - 1) * limit;
    const filterQuery = {};

    if (search) {
      filterQuery.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { review: { $regex: search, $options: "i" } },
      ];
    }

    if (rating) {
      filterQuery.rating = parseInt(rating);
    }

    if (status === "hidden") {
      filterQuery.isHidden = true;
    } else if (status === "visible") {
      filterQuery.isHidden = false;
    }

    if (productId) {
      filterQuery.productId = productId;
    }

    if (req.query.reported === "true") {
      filterQuery.reported = true;
    }

    const reviews = await Review.find(filterQuery)
      .populate("productId", "name category imageUrl")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skipIndex);

    const totalReviews = await Review.countDocuments(filterQuery);

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        pages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Toggle review hiding state (Hide / Restore)
 * @route   PUT /api/reviews/admin/:id/visibility
 * @access  Private/Admin
 */
const adminToggleVisibility = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    // Recalculate stats for the product
    await updateProductRatingStats(review.productId);

    res.status(200).json({
      success: true,
      message: `Review successfully ${review.isHidden ? "hidden" : "restored"}`,
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a review (Admin)
 * @route   DELETE /api/reviews/admin/:id
 * @access  Private/Admin
 */
const adminDeleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate rating aggregates on the Product
    await updateProductRatingStats(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete a review (Customer self)
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized" });
    }

    const productId = review.productId;
    await Review.findByIdAndDelete(reviewId);

    // Recalculate rating aggregates on the Product
    await updateProductRatingStats(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Report a review
 * @route   POST /api/reviews/:id/report
 * @access  Public
 */
const reportReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.reported = true;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review reported successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Merchant Reply to a review
 * @route   POST /api/reviews/admin/:id/reply
 * @access  Private/Admin
 */
const adminReplyReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { replyText } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.merchantReply = {
      replyText: replyText.trim(),
      repliedAt: new Date(),
    };
    await review.save();

    res.status(200).json({
      success: true,
      message: "Merchant reply posted successfully",
      review,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get Review Campaign Automation Statistics
 * @route   GET /api/reviews/admin/campaign-stats
 * @access  Private/Admin
 */
const getReviewCampaignStats = async (req, res) => {
  try {
    const totalReviewsCount = await Review.countDocuments({});

    const reminderStats = await Order.aggregate([
      { $match: { reviewReminderCount: { $gt: 0 } } },
      { $group: { _id: null, totalSent: { $sum: "$reviewReminderCount" } } },
    ]);

    const totalRemindersSent = reminderStats.length > 0 ? reminderStats[0].totalSent : 0;

    const pendingEligibleOrders = await Order.countDocuments({
      status: "Delivered",
      reviewCampaignCompleted: { $ne: true },
    });

    const conversionRate = totalRemindersSent > 0
      ? Math.min(100, Math.round((totalReviewsCount / totalRemindersSent) * 100))
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRemindersSent,
        totalReviewsCount,
        pendingEligibleOrders,
        conversionRate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
