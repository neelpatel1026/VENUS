const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Complaint = require('../models/Complaint');
const Review = require('../models/Review');
const ReturnRequest = require('../models/ReturnRequest');

const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({ role: 'user' });

    // Start-of boundaries calculations
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfThisWeek = new Date(startOfToday);
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 7);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfThisMonth = new Date(startOfToday);
    startOfThisMonth.setDate(startOfThisMonth.getDate() - 30);

    const startOfLastMonth = new Date(startOfThisMonth);
    startOfLastMonth.setDate(startOfLastMonth.getDate() - 30);

    // Retrieve active store orders
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    const todayOrders = orders.filter(o => o.createdAt >= startOfToday && o.status !== "Cancelled");
    const yesterdayOrders = orders.filter(o => o.createdAt >= startOfYesterday && o.createdAt < startOfToday && o.status !== "Cancelled");

    const thisWeekOrders = orders.filter(o => o.createdAt >= startOfThisWeek && o.status !== "Cancelled");
    const lastWeekOrders = orders.filter(o => o.createdAt >= startOfLastWeek && o.createdAt < startOfThisWeek && o.status !== "Cancelled");

    const thisMonthOrders = orders.filter(o => o.createdAt >= startOfThisMonth && o.status !== "Cancelled");
    const lastMonthOrders = orders.filter(o => o.createdAt >= startOfLastMonth && o.createdAt < startOfThisMonth && o.status !== "Cancelled");

    const todayRev = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const yesterdayRev = yesterdayOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const thisWeekRev = thisWeekOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const lastWeekRev = lastWeekOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const thisMonthRev = thisMonthOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const lastMonthRev = lastMonthOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    const getGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revenueGrowthToday = getGrowth(todayRev, yesterdayRev);
    const ordersGrowthToday = getGrowth(todayOrders.length, yesterdayOrders.length);

    const revenueGrowthWeek = getGrowth(thisWeekRev, lastWeekRev);
    const ordersGrowthWeek = getGrowth(thisWeekOrders.length, lastWeekOrders.length);

    const revenueGrowthMonth = getGrowth(thisMonthRev, lastMonthRev);
    const ordersGrowthMonth = getGrowth(thisMonthOrders.length, lastMonthOrders.length);

    // Monthly revenue trend (last 6 calendar months)
    const monthlyTrend = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyTrend[label] = { revenue: 0, ordersCount: 0 };
    }

    orders.forEach(o => {
      if (o.status !== "Cancelled" && o.status !== "Returned" && o.status !== "Refund Completed") {
        const oDate = new Date(o.createdAt);
        const label = oDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyTrend[label] !== undefined) {
          monthlyTrend[label].revenue += o.totalAmount;
          monthlyTrend[label].ordersCount += 1;
        }
      }
    });

    const monthlyTrendArray = Object.keys(monthlyTrend).map(key => ({
      month: key,
      revenue: Math.round(monthlyTrend[key].revenue),
      orders: monthlyTrend[key].ordersCount
    }));

    // Top Selling Products calculations
    const productSales = {};
    orders.forEach(o => {
      if (o.status !== "Cancelled" && o.items) {
        o.items.forEach(item => {
          if (item.productId) {
            const pId = item.productId.toString();
            if (!productSales[pId]) {
              productSales[pId] = {
                id: pId,
                name: item.productName,
                image: item.productImage || "/placeholder.jpg",
                unitsSold: 0,
                revenue: 0
              };
            }
            productSales[pId].unitsSold += item.qty;
            productSales[pId].revenue += item.qty * item.price;
          }
        });
      }
    });

    const allProducts = await Product.find({}).lean();
    const topProducts = Object.values(productSales)
      .map(p => {
        const match = allProducts.find(prod => prod._id.toString() === p.id);
        return {
          ...p,
          stockRemaining: match ? match.stock : 0
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const lowStockProducts = allProducts
      .filter(p => p.stock < 5)
      .map(p => ({
        _id: p._id,
        name: p.name,
        image: p.imageUrl || "/placeholder.jpg",
        category: p.category,
        price: p.price,
        stock: p.stock
      }));

    const recentOrdersList = orders.slice(0, 5).map(o => ({
      _id: o._id,
      customerName: o.customerName,
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status
    }));

    const totalRevenue = orders
      .filter(o => o.status !== "Cancelled" && o.status !== "Returned" && o.status !== "Refund Completed")
      .reduce((acc, item) => acc + item.totalAmount, 0);

    const ordersConfirmedToday = todayOrders.length;
    const ordersProcessing = orders.filter(o => o.status === "Processing").length;
    const ordersPacked = orders.filter(o => o.status === "Packed").length;
    const ordersShipped = orders.filter(o => o.status === "Shipped").length;
    const ordersOutForDelivery = orders.filter(o => o.status === "Out For Delivery").length;
    const ordersDelivered = orders.filter(o => o.status === "Delivered").length;
    const ordersCancelled = orders.filter(o => o.status === "Cancelled").length;
    const ordersReturned = orders.filter(o => ["Return Requested", "Return Approved", "Refund Completed", "Returned"].includes(o.status)).length;

    // Coupon stats
    const coupons = await Coupon.find({}).lean();
    const couponAnalytics = coupons.map(c => ({
      _id: c._id,
      code: c.code,
      discount: c.discount,
      expiryDate: c.expiryDate,
      active: c.active,
      timesUsed: orders.filter(o => o.couponCode === c.code && o.status !== "Cancelled").length,
      revenueGenerated: orders
        .filter(o => o.couponCode === c.code && o.status !== "Cancelled")
        .reduce((acc, o) => acc + o.totalAmount, 0)
    }));

    // Action Center Counts
    const startOfTodayForCustomers = new Date();
    startOfTodayForCustomers.setHours(0, 0, 0, 0);
    const newCustomersToday = await User.countDocuments({ role: 'user', createdAt: { $gte: startOfTodayForCustomers } });
    const openTicketsCount = await Complaint.countDocuments({ status: { $in: ["Pending", "In Progress"] } });
    const pendingReturnsCount = await ReturnRequest.countDocuments({ status: "Pending" });

    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 7);
    const expiringCouponsCount = await Coupon.countDocuments({ expiryDate: { $gte: new Date(), $lte: soonDate }, active: true });
    const reviewsAwaitingApprovalCount = await Review.countDocuments({ isHidden: false });

    res.json({
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      todayRev,
      todayOrders: todayOrders.length,
      revenueGrowthToday,
      ordersGrowthToday,
      thisWeekRev,
      thisWeekOrders: thisWeekOrders.length,
      revenueGrowthWeek,
      ordersGrowthWeek,
      thisMonthRev,
      thisMonthOrders: thisMonthOrders.length,
      revenueGrowthMonth,
      ordersGrowthMonth,
      monthlyTrend: monthlyTrendArray,
      topProducts,
      lowStockProducts,
      recentOrders: recentOrdersList,
      couponAnalytics,
      ordersConfirmedToday,
      ordersProcessing,
      ordersPacked,
      ordersShipped,
      ordersOutForDelivery,
      ordersDelivered,
      ordersCancelled,
      ordersReturned,
      newCustomersToday,
      openTicketsCount,
      pendingReturnsCount,
      expiringCouponsCount,
      reviewsAwaitingApprovalCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const mongoose = require("mongoose");

const getAdminSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.json({ success: true, results: { orders: [], products: [], users: [] } });
    }

    const regex = new RegExp(q.trim(), "i");
    const isObjectId = mongoose.Types.ObjectId.isValid(q.trim());
    const orderQuery = {
      $or: [
        { customerName: regex },
        { customerEmail: regex },
        { customerPhone: regex },
        { couponCode: regex }
      ]
    };
    if (isObjectId) {
      orderQuery.$or.push({ _id: q.trim() });
    }
    const orders = await Order.find(orderQuery).limit(5).lean();
    const products = await Product.find({ name: regex }).limit(5).lean();

    const users = await User.find({
      role: "user",
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex }
      ]
    }).limit(5).lean();

    res.json({
      success: true,
      results: {
        orders,
        products,
        users
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminStats, getAdminSearch };