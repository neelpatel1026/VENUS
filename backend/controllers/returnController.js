const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");

const createReturnRequest = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const imageUrls = [];

    const order = await Order.findOne({
      _id: orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    if (order.returnAllowedTill && new Date() > order.returnAllowedTill) {
      return res.status(400).json({
        success: false,
        message: "Return period expired",
      });
    }

    const existing = await ReturnRequest.findOne({
      orderId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Return request already submitted",
      });
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileStr = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

        const uploaded = await cloudinary.uploader.upload(fileStr, {
          folder: "returns",
        });

        imageUrls.push(uploaded.secure_url);
      }
    }

    // const request = await ReturnRequest.create({
    //   orderId,
    //   userId: req.user._id,
    //   reason,
    // });
    const request = await ReturnRequest.create({
      orderId,
      userId: req.user._id,
      reason,
      returnImages: imageUrls,
    });

    order.status = "Return Requested";
    order.orderTimeline.push({
      status: "Return Requested",
      timestamp: new Date(),
      updatedBy: req.user ? req.user.name : "System",
    });
    await order.save();

    // Send return request email asynchronously (non-blocking)
    const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
    sendTimelineStatusEmailAsync(order, "Return Requested").catch((err) => {
      console.error("❌ Return Requested email failed:", err.message);
    });

    res.status(201).json({
      success: true,
      request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      userId: req.user._id,
    })
      .populate("orderId")
      .sort({
        createdAt: -1,
      });

    res.json(returns);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getReturns = async (req, res) => {
  try {
    const requests = await ReturnRequest.find()
      .populate("orderId")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const request = await ReturnRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const previousStatus = request.status;
    request.status = req.body.status;
    await request.save();

    if (req.body.status === "Approved" && previousStatus !== "Approved") {
      const order = await Order.findById(request.orderId);
      if (order && order.status !== "Return Approved") {
        // Restock inventory for all items in the order
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.qty },
          });
        }
        order.status = "Return Approved";
        order.orderTimeline.push({
          status: "Return Approved",
          timestamp: new Date(),
          updatedBy: req.user ? req.user.name : "System",
        });
        await order.save();

        const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
        sendTimelineStatusEmailAsync(order, "Return Approved").catch((err) => {
          console.error("❌ Return Approved email failed:", err.message);
        });
      }
    } else if (req.body.status === "Refunded" && previousStatus !== "Refunded") {
      const order = await Order.findById(request.orderId);
      if (order && order.status !== "Refund Completed") {
        order.status = "Refund Completed";
        order.orderTimeline.push({
          status: "Refund Completed",
          timestamp: new Date(),
          updatedBy: req.user ? req.user.name : "System",
        });
        await order.save();

        const { sendTimelineStatusEmailAsync } = require("../utils/notificationService.js");
        sendTimelineStatusEmailAsync(order, "Refund Completed").catch((err) => {
          console.error("❌ Refund Completed email failed:", err.message);
        });
      }
    }

    res.json({
      success: true,
      message: "Return status updated",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createReturnRequest,
  getMyReturns,
  getReturns,
  updateReturnStatus,
};
