const rateLimit = require("express-rate-limit");

const isDev = process.env.NODE_ENV !== "production";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 600, // 600 requests per 15 mins in prod (allows high volume browsing), 10000 in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please slow down and try again later.",
  skip: (req) => {
    // 1. Skip CORS preflight OPTIONS requests
    if (req.method === "OPTIONS") return true;

    // 2. Skip health check endpoint
    if (req.path === "/api/health" || req.path === "/health") return true;

    // 3. In Development mode, skip rate-limiting for local loopback IPs (React StrictMode, Vite HMR)
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
      `[RATE LIMIT EXCEEDED] [GLOBAL] IP: ${req.ip} | Method: ${req.method} | Path: ${req.baseUrl + req.path} | User: ${userId} | Time: ${new Date().toISOString()}`
    );
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
});

module.exports = globalLimiter;
