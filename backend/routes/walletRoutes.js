const express = require("express");

const router = express.Router();

// const verifyJWT = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddleware");

const {
  getWallet,
  getTransactions,
} = require("../controllers/walletController");

router.get("/", protect, getWallet);

router.get("/transactions", protect, getTransactions);

module.exports = router;
