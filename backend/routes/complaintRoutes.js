const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAdminComplaints,
  updateComplaintAdmin,
} = require("../controllers/complaintController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Optional auth helper to check if a user is logged in when submitting a ticket
const optionalProtect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // Proceed without setting req.user if token is invalid
    }
  }
  next();
};

const adminLimiter = require("../middleware/adminLimiter");

router.route("/")
  .post(optionalProtect, createComplaint)
  .get(protect, admin, adminLimiter, getAdminComplaints);

router.route("/my").get(protect, getMyComplaints);

router.route("/:id")
  .get(protect, getComplaintById)
  .put(protect, admin, adminLimiter, updateComplaintAdmin);

module.exports = router;
