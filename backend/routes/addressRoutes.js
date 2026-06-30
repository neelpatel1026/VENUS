// import express from "express";
// import {
//   addAddress,
//   getAddresses,
//   updateAddress,
//   deleteAddress,
// } from "../controllers/addressController.js";

// import authMiddleware from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.post("/add", authMiddleware, addAddress);
// router.get("/", authMiddleware, getAddresses);
// router.put("/:id", authMiddleware, updateAddress);
// router.delete("/:id", authMiddleware, deleteAddress);

// export default router;

const express = require("express");
const router = express.Router();

const {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController.js");

// const authMiddleware = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddleware.js");


router.post("/add", protect, addAddress);
router.get("/", protect, getAddresses);
router.put("/:id", protect, updateAddress);
router.delete("/:id", protect, deleteAddress);


module.exports = router;