const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");

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

    request.status = req.body.status;

    await request.save();

    if (req.body.status === "Approved") {
      await Order.findByIdAndUpdate(request.orderId, {
        status: "Returned",
      });
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
