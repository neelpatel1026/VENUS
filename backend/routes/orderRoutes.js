const express = require("express");

const {
  addOrderItems,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  bulkUpdateOrderStatus,
  getOrderById,
  getMyOrderById,
  downloadInvoice,
  exportOrdersExcel,
  resendOrderEmail,
  cancelMyOrder,
  deleteOrder,
  approveOrderCancellation,
  rejectOrderCancellation,
  updateOrderRefundDetails,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");
const paymentLimiter = require("../middleware/paymentLimiter");
const adminLimiter = require("../middleware/adminLimiter");

const router = express.Router();
router.route("/").post(protect, paymentLimiter, addOrderItems).get(protect, admin, adminLimiter, getOrders);

router.route("/myorders").get(protect, getMyOrders);

router.route("/myorders/:id").get(protect, getMyOrderById);
router.route("/bulk-status").put(protect, admin, adminLimiter, bulkUpdateOrderStatus);
router.route("/:id/cancel").put(protect, cancelMyOrder);
router.route("/:id/approve-cancellation").put(protect, admin, adminLimiter, approveOrderCancellation);
router.route("/:id/reject-cancellation").put(protect, admin, adminLimiter, rejectOrderCancellation);
router.route("/:id/refund").put(protect, admin, adminLimiter, updateOrderRefundDetails);

router.route("/:id/invoice").get(protect, downloadInvoice);

router.route("/:id/status").put(protect, admin, adminLimiter, updateOrderStatus);
router.route("/:id/resend-email").post(protect, admin, adminLimiter, resendOrderEmail);

router.route("/export/excel").get(protect, admin, adminLimiter, exportOrdersExcel);

router.route("/:id")
  .get(protect, admin, adminLimiter, getOrderById)
  .delete(protect, admin, adminLimiter, deleteOrder);

module.exports = router;
