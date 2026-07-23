const helmet = require("helmet");

const isProduction = process.env.NODE_ENV === "production";

const helmetConfig = helmet({
  // 1. Content Security Policy (not over-restricted to allow Razorpay, Cloudinary, and Vercel frontends)
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", 
        "https://checkout.razorpay.com", 
        "https://*.razorpay.com"
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.razorpay.com",
        "https://images.unsplash.com",
        "https://*.vercel.app"
      ],
      connectSrc: [
        "'self'",
        "https://lumberjack.razorpay.com",
        "https://api.razorpay.com",
        "https://res.cloudinary.com",
        "https://api.cloudinary.com",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5000",
        "https://*.vercel.app"
      ],
      frameSrc: [
        "'self'", 
        "https://api.razorpay.com", 
        "https://checkout.razorpay.com", 
        "https://*.razorpay.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProduction ? [] : null, // Upgrades requests in production
    },
  },
  // 2. Cross-Origin Opener Policy (allows Razorpay checkout popups)
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  // 3. Cross-Origin Resource Policy (allows cross-origin requests from frontend)
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // 4. Cross-Origin Embedder Policy (must be disabled to allow loading external images/resources)
  crossOriginEmbedderPolicy: false,
  // 5. Referrer Policy
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  // 6. Strict Transport Security (HSTS - Production only)
  hsts: isProduction
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  // 7. X-Content-Type-Options
  xContentTypeOptions: true,
  // 8. X-Frame-Options
  xFrameOptions: { action: "sameorigin" },
  // 9. Hide X-Powered-By (explicit)
  hidePoweredBy: true,
  // 10. DNS Prefetch Control
  xDnsPrefetchControl: { allow: false },
});

module.exports = helmetConfig;
