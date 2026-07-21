const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV !== "production";

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 60, // 60 admin actions per 15 mins in prod, 1000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many administrative attempts. Please try again after 15 minutes.",
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
      `[RATE LIMIT EXCEEDED] [ADMIN] IP: ${req.ip} | Method: ${req.method} | Path: ${req.baseUrl + req.path} | User: ${userId} | Time: ${new Date().toISOString()}`
    );
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});

module.exports = adminLimiter;
