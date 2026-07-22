const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV !== "production";

// Skip helper for development local testing
const skipLocalhost = (req) => {
  if (req.method === "OPTIONS") return true;
  if (isDev) {
    const ip = req.ip || req.socket?.remoteAddress || "";
    if (ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1" || ip.includes("localhost")) {
      return true;
    }
  }
  return false;
};

// Send OTP: 3 requests / 15 minutes
const otpLimiter = rateLimit({
  windowMs: parseInt(process.env.SEND_OTP_LIMIT_WINDOW_MINS || "15") * 60 * 1000,
  max: isDev ? 100 : parseInt(process.env.SEND_OTP_LIMIT_MAX || "3"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP requests. Please try again after 15 minutes.",
  skip: skipLocalhost,
  handler: (req, res, next, options) => {
    const userId = req.user ? req.user._id : "Unauthenticated";
    console.warn(
      `[RATE LIMIT EXCEEDED] [SEND_OTP] IP: ${req.ip} | Method: ${req.method} | Path: ${req.baseUrl + req.path} | User: ${userId} | Time: ${new Date().toISOString()}`
    );
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});

module.exports = otpLimiter;
