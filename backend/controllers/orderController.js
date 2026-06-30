const Order = require("../models/Order.js");
const Product = require("../models/Product.js");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail.js");
const generateInvoice = require("../utils/generateInvoice.js");
const exportOrders = require("../utils/exportOrders");

// @desc    Create new order
// @route   POST /api/orders
// @access  Private

const addOrderItems = async (req, res) => {
  try {
    const { items, totalAmount, address, paymentId } = req.body;
    console.log(address);

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      // Check stock
      if (product.stock <= 0 || product.stock < item.qty) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }
    }

    // OTP Verification for COD

    if ((req.body.paymentMethod || "COD") === "COD") {
      const user = await User.findById(req.user._id);

      console.log("USER PHONE:", user.phone);

      console.log("ADDRESS PHONE:", address.phone);

      // console.log("OTP VERIFIED:", user.otpVerified);
      console.log("EMAIL VERIFIED:", user.emailVerified);

      // if (!user.otpVerified) {
      if (!user.emailVerified) {
        console.log("FAILED OTP");

        return res.status(400).json({
          success: false,
          message: "Please verify your email before placing COD order",
        });
      }
    }

    const order = new Order({
      userId: req.user._id,
      customerName: req.user.name,
      customerEmail: req.user.email,

      customerPhone: address.phone,

      items: items.map((item) => ({
        productId: item.productId || item._id,
        productName: item.productName || item.name,
        productImage: item.productImage || item.imageUrl,
        qty: item.qty,
        price: item.price,
      })),

      subtotal: totalAmount,
      shippingCharge: 0,
      taxAmount: 0,
      totalAmount,

      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },

      paymentMethod: req.body.paymentMethod || "COD",

      // paymentId,
      // paymentStatus: "Pending",
      paymentId,
      otpVerified: (req.body.paymentMethod || "COD") === "COD",
      paymentStatus: "Pending",
      status: "Pending",
    });

    // Save order
    const createdOrder = await order.save();

    // Safely decrease stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -item.qty },
        },
        {
          new: true,
        },
      );
    }

    // Send confirmation email
    const message = `
      <h2>Order Confirmation</h2>

      <p>Hello ${req.user.name},</p>

      <p>
        Your order has been successfully placed!
      </p>

      <p>
        <strong>Order ID:</strong> ${createdOrder._id}
      </p>

      <p>
        <strong>Total Amount:</strong> ₹${totalAmount}
      </p>

      <p>
        <strong>Shipping Address:</strong><br/>
        // ${address.street}, ${address.city}
        ${address.addressLine1}, ${address.city}
      </p>

      <p>
        Thank you for shopping with VENUS ❤️
      </p>
    `;

    sendEmail({
      email: req.user.email,
      subject: "ELYSORIA - Order Confirmation",
      message,
    }).catch(console.error);

    // Send response
    res.status(201).json(createdOrder);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Admin

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const updateData = {
      status,
    };

    if (status === "Delivered") {
      updateData.deliveredAt = new Date();

      updateData.returnAllowedTill = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: "after",
    });

    await sendEmail({
  email: order.customerEmail,

  subject: `Order ${status} - ELYSORIA`,

  message: `
    <h2>Order Update</h2>

    <p>Hello ${order.customerName},</p>

    <p>
      Your order status has been updated.
    </p>

    <p>
      <strong>Status:</strong>
      ${status}
    </p>

    <p>
      <strong>Order ID:</strong>
      ${order._id}
    </p>

    <p>
      Thank you for shopping with ELYSORIA ❤️
    </p>
  `,
});

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "userId",
      "name email",
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const downloadInvoice = async (req, res) => {
  try {
    console.log("Invoice route hit");

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    console.log("Order found:", order._id);

    generateInvoice(order, res);
  } catch (error) {
    console.error("INVOICE ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const exportOrdersExcel = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });

    await exportOrders(orders, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrders,
  getMyOrderById,
  updateOrderStatus,
  getOrderById,
  downloadInvoice,
  exportOrdersExcel,
};
