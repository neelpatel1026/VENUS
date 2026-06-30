const express = require("express");

const router = express.Router();
const { admin } = require("../middleware/adminMiddleware");
const returnUpload = require("../middleware/returnUpload");

const {
  createReturnRequest,
  getMyReturns,
  getReturns,
  updateReturnStatus,
} = require("../controllers/returnController");

const { protect } = require("../middleware/authMiddleware");

// router.post("/", protect, createReturnRequest);
router.post("/", protect, returnUpload.array("images", 5), createReturnRequest);

router.get("/my", protect, getMyReturns);

router.get("/", protect, admin, getReturns);

router.put("/:id", protect, admin, updateReturnStatus);

module.exports = router;
