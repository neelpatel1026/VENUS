const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");

const createOrder = async (req, res) => {
  try {
    const { items, couponCode, coinsUsed } = req.body;

    // 1. Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      // Fallback if client passed raw amount in fallback mode
      const rawAmount = Number(req.body.amount);
      if (!rawAmount || rawAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid order items or amount" });
      }
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const order = await instance.orders.create({ amount: Math.round(rawAmount * 100), currency: "INR" });
      return res.json(order);
    }

    // 2. Authoritative database price calculation
    let calculatedSubtotal = 0;
    for (const item of items) {
      const prodId = item.productId || item._id;
      const product = await Product.findById(prodId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found` });
      }
      calculatedSubtotal += product.price * (item.qty || 1);
    }

    if (calculatedSubtotal <= 0) {
      return res.status(400).json({ success: false, message: "Cart total cannot be ₹0" });
    }

    // 3. Coupon discount validation
    let calculatedDiscount = 0;
    if (couponCode) {
      const Coupon = require("../models/Coupon");
      const { checkCouponValidity, calculateCouponDiscount } = require("./couponController");
      const appliedCoupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
      if (appliedCoupon) {
        const validation = await checkCouponValidity(appliedCoupon, items, req.user ? req.user._id : null);
        if (validation.valid) {
          calculatedDiscount = calculateCouponDiscount(appliedCoupon, items);
        }
      }
    }

    // 4. Rewards coin discount validation
    const requestCoinsUsed = Number(coinsUsed) || 0;
    let validCoinsDiscount = 0;
    const postCouponSubtotal = Math.max(0, calculatedSubtotal - calculatedDiscount);

    if (req.user && requestCoinsUsed > 0) {
      const User = require("../models/User");
      const userProfile = await User.findById(req.user._id);
      if (userProfile && !userProfile.isWalletFrozen) {
        validCoinsDiscount = Math.min(postCouponSubtotal, Math.min(userProfile.walletBalance, requestCoinsUsed));
      }
    }

    const postCoinsSubtotal = Math.max(0, postCouponSubtotal - validCoinsDiscount);

    // 5. Instant 10% Online Payment Discount (UPI / Card / Net Banking)
    const paymentMethodDiscount = parseFloat((postCoinsSubtotal * 0.10).toFixed(2));
    const calculatedTotal = parseFloat(Math.max(0, postCoinsSubtotal - paymentMethodDiscount).toFixed(2));

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(calculatedTotal * 100), // amount in paise
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-8)}`
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).json({ success: false, message: "Error creating Razorpay order" });

    res.json({
      ...order,
      authoritativeTotal: calculatedTotal,
      onlineDiscount: paymentMethodDiscount
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    res.status(500).json({ success: false, message: error.message || "Payment initiation failed" });
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
