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

// Custom limit handler for logging and JSON response
const createHandler = (limiterName) => {
  return (req, res, next, options) => {
    const userId = req.user ? req.user._id : "Unauthenticated";
    console.warn(
      `[RATE LIMIT EXCEEDED] [${limiterName}] IP: ${req.ip} | Method: ${req.method} | Path: ${req.baseUrl + req.path} | User: ${userId} | Time: ${new Date().toISOString()}`
    );
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  };
};

// 1. Login: 5 attempts / 10 minutes
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.LOGIN_LIMIT_WINDOW_MINS || "10") * 60 * 1000,
  max: isDev ? 100 : parseInt(process.env.LOGIN_LIMIT_MAX || "5"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many login attempts. Please try again after 10 minutes.",
  skip: skipLocalhost,
  handler: createHandler("LOGIN"),
});

// 2. Register: 5 requests / hour
const registerLimiter = rateLimit({
  windowMs: parseInt(process.env.REGISTER_LIMIT_WINDOW_MINS || "60") * 60 * 1000,
  max: isDev ? 100 : parseInt(process.env.REGISTER_LIMIT_MAX || "5"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many registration requests. Please try again after 1 hour.",
  skip: skipLocalhost,
  handler: createHandler("REGISTER"),
});

// 3. Forgot Password: 3 requests / hour
const forgotPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.FORGOT_PASSWORD_LIMIT_WINDOW_MINS || "60") * 60 * 1000,
  max: isDev ? 100 : parseInt(process.env.FORGOT_PASSWORD_LIMIT_MAX || "3"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many forgot password requests. Please try again after 1 hour.",
  skip: skipLocalhost,
  handler: createHandler("FORGOT_PASSWORD"),
});

// 4. Reset Password: 5 attempts / hour
const resetPasswordLimiter = rateLimit({
  windowMs: parseInt(process.env.RESET_PASSWORD_LIMIT_WINDOW_MINS || "60") * 60 * 1000,
  max: isDev ? 100 : parseInt(process.env.RESET_PASSWORD_LIMIT_MAX || "5"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many password reset attempts. Please try again after 1 hour.",
  skip: skipLocalhost,
  handler: createHandler("RESET_PASSWORD"),
});

// 5. Verify OTP: 10 attempts / 10 minutes
const verifyOtpLimiter = rateLimit({
  windowMs: parseInt(process.env.VERIFY_OTP_LIMIT_WINDOW_MINS || "10") * 60 * 1000,
  max: isDev ? 200 : parseInt(process.env.VERIFY_OTP_LIMIT_MAX || "10"),
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many OTP verification attempts. Please try again after 10 minutes.",
  skip: skipLocalhost,
  handler: createHandler("VERIFY_OTP"),
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyOtpLimiter,
};
