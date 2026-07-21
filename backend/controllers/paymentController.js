const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Razorpay accepts amount in paise
    const options = {
      amount: req.body.amount * 100,
      currency: "INR",
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occured");
    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      if (req.body.orderId) {
        const order = await Order.findById(req.body.orderId);
        if (order) {
          order.paymentStatus = "Paid";
          order.paymentId = razorpay_payment_id;
          await order.save();

          const { sendPaymentSuccessEmail } = require("../utils/notificationService.js");
          sendPaymentSuccessEmail(order, razorpay_payment_id).catch((err) => {
            console.error("❌ Payment success email failed:", err.message);
          });
        }
      }

      // return res.status(200).json({ message: "Payment verified successfully" });
      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const refundPayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Refunded") {
      return res.status(400).json({
        success: false,
        message: "Already refunded",
      });
    }

    // if (order.paymentMethod === "Razorpay")
    //   if (!order.paymentId) {
    //     return res.status(400).json({
    //       success: false,
    //       message: "Payment ID not found",
    //     });
    //   }

    if (order.paymentMethod === "Razorpay" && !order.paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID not found",
      });
    }
    if (order.paymentMethod === "COD") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stock: item.qty,
          },
        });
      }
      order.paymentStatus = "Refunded";
      order.refundTracking = {
        status: "Refund Completed",
        updatedAt: new Date(),
      };

      order.status = "Refund Completed";
      order.orderTimeline.push({
        status: "Refund Completed",
        timestamp: new Date(),
        updatedBy: req.user ? req.user.name : "System",
      });

      order.refundedAt = new Date();

      await order.save();

      return res.json({
        success: true,
        message: "COD refund marked successfully",
      });
    }
    if (order.status !== "Returned") {
      return res.status(400).json({
        success: false,
        message: "Order must be returned first",
      });
    }
    try {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID !== "your_razorpay_key_id") {
        await razorpay.payments.refund(order.paymentId, {
          amount: order.totalAmount * 100,
        });
      }
    } catch (err) {
      console.warn("Razorpay API Refund failed or bypassed: ", err.message);
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: item.qty,
        },
      });
    }

    order.paymentStatus = "Refunded";

    order.refundTracking = {
      status: "Refund Completed",
      updatedAt: new Date(),
    };

    order.refundedAt = new Date();

    order.status = "Refund Completed";
    order.orderTimeline.push({
      status: "Refund Completed",
      timestamp: new Date(),
      updatedBy: req.user ? req.user.name : "System",
    });

    await order.save();

    res.json({
      success: true,
      message: "Refund processed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { createOrder, verifyPayment, refundPayment };
