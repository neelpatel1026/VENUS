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
  const { items, totalAmount, address, paymentId } = req.body;
  const deductedItems = [];

  try {
    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No order items",
      });
    }

    // Atomic stock check and deduction loop
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } },
        { new: true }
      );

      if (!product) {
        // Rollback previously deducted items
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }

        const prod = await Product.findById(item.productId);
        return res.status(400).json({
          message: `${prod ? prod.name : "Product"} has insufficient stock or does not exist`,
        });
      }
      deductedItems.push({ productId: item.productId, qty: item.qty });
    }

    // OTP Verification for COD
    if ((req.body.paymentMethod || "COD") === "COD") {
      const user = await User.findById(req.user._id);

      if (!user.emailVerified) {
        // Rollback stocks since validation failed!
        for (const rolledBackItem of deductedItems) {
          await Product.findByIdAndUpdate(rolledBackItem.productId, {
            $inc: { stock: rolledBackItem.qty },
          });
        }
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
      paymentId,
      otpVerified: (req.body.paymentMethod || "COD") === "COD",
      paymentStatus: "Pending",
      status: "Pending",
    });

    // Save order
    const createdOrder = await order.save();

    // Send confirmation email
    const message = `
      <h2>Order Confirmation</h2>
      <p>Hello ${req.user.name},</p>
      <p>Your order has been successfully placed!</p>
      <p><strong>Order ID:</strong> ${createdOrder._id}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
      <p><strong>Shipping Address:</strong><br/>
         ${address.addressLine1}, ${address.city}
      </p>
      <p>Thank you for shopping with VENUS ❤️</p>
    `;

    sendEmail({
      email: req.user.email,
      subject: "VENUS CARE - Order Confirmation",
      message,
    }).catch(console.error);

    // Send response
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    // Rollback stocks on any general server/db error during saving
    for (const rolledBackItem of deductedItems) {
      await Product.findByIdAndUpdate(rolledBackItem.productId, {
        $inc: { stock: rolledBackItem.qty },
      });
    }
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

  subject: `Order ${status} - VENUS CARE`,

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
      Thank you for shopping with VENUS CARE ❤️
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

    await generateInvoice(order, res);
  } catch (error) {
    console.error("INVOICE ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};

const exportOrdersExcel = async (req, res) => {
  try {
    const { search, status, paymentMethod, startDate, endDate } = req.query;
    const query = {};

    if (search) {
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = search;
      } else {
        query.$or = [
          { customerName: { $regex: search, $options: "i" } },
          { customerEmail: { $regex: search, $options: "i" } },
          { customerPhone: { $regex: search, $options: "i" } }
        ];
      }
    }

    if (status) {
      query.status = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
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
