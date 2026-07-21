const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV !== "production";

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 200 : 20, // 20 payment/checkout attempts per 15 mins in prod, 200 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many payment/checkout attempts. Please try again after 15 minutes.",
  skip: (req) => {
    if (req.method === "OPTIONS") return true;
    if (isDev) {
      const ip = req.ip || req.socket?.remoteAddress || "";
      if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.includes("localhost")) {
        return true;
      }
    }
    return false;
  },
  handler: (req, res, next, options) => {
    const userId = req.user ? req.user._id : "Unauthenticated";
    console.warn(
      `[RATE LIMIT EXCEEDED] [PAYMENT] IP: ${req.ip} | Method: ${req.method} | Path: ${req.baseUrl + req.path} | User: ${userId} | Time: ${new Date().toISOString()}`
    );
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});

module.exports = paymentLimiter;
