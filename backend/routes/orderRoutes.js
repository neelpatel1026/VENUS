const express = require("express");

const {
  addOrderItems,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  getOrderById,
  getMyOrderById,
  downloadInvoice,
  exportOrdersExcel,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

const router = express.Router();
router.route("/").post(protect, addOrderItems).get(protect, admin, getOrders);

router.route("/myorders").get(protect, getMyOrders);

router.route("/myorders/:id").get(protect, getMyOrderById);

router.route("/:id/invoice").get(protect, downloadInvoice);

router.route("/:id/status").put(protect, admin, updateOrderStatus);

router.route("/export/excel").get(protect, admin, exportOrdersExcel);

router.route("/:id").get(protect, admin, getOrderById);

module.exports = router;
