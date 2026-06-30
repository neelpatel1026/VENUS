const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

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
      await Order.findByIdAndUpdate(req.body.orderId, {
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id,
      });

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
      // const wallet = await Wallet.findOne({
      //   userId: order.userId,
      // });
      // if (wallet) {
      //   wallet.balance += order.totalAmount;

      //   await wallet.save();

      //   await WalletTransaction.create({
      //     userId: order.userId,
      //     amount: order.totalAmount,
      //     type: "Credit",
      //     description: `Refund for Order ${order._id}`,
      //   });
      // }
      order.paymentStatus = "Refunded";
      order.refundTracking = {
        status: "Refund Completed",
        updatedAt: new Date(),
      };

      order.status = "Returned";

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
    {
      await razorpay.payments.refund(order.paymentId, {
        amount: order.totalAmount * 100,
      });
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

    order.status = "Returned";

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
