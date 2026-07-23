const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const globalLimiter = require("./middleware/globalLimiter.js");
const connectDB = require("./config/db.js");
const path = require("path");

dotenv.config();

connectDB();

const app = express();

// Trust Proxy for upstream reverse proxies (Nginx, Heroku, Cloudflare, etc.)
app.set("trust proxy", 1);

const helmetConfig = require("./middleware/helmetConfig.js");

// Security Headers
app.use(helmetConfig);

app.use(globalLimiter);

// CORS
const allowedOrigins = ["http://localhost:5173"];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

// NoSQL Query Injection Sanitizer
const sanitizeMongo = (obj) => {
  if (obj instanceof Object) {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else {
        sanitizeMongo(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeMongo(req.body);
  if (req.query) sanitizeMongo(req.query);
  if (req.params) sanitizeMongo(req.params);
  next();
});

// Body Parser & Cookie Parser
const cookieParser = require("cookie-parser");
app.use(express.json());
app.use(cookieParser());

// CSRF Routes (exclude from protection middleware)
app.use("/api/csrf", require("./routes/csrfRoutes"));

// CSRF Protection Middleware
const csrfProtection = require("./middleware/csrfProtection");
app.use(csrfProtection);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/address", require("./routes/addressRoutes"));
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/email-otp", require("./routes/emailOtpRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
// Health Check Endpoint
const mongoose = require("mongoose");
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "Connected" : "Disconnected";
  if (dbStatus === "Connected") {
    return res.status(200).json({
      status: "UP",
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date()
    });
  } else {
    return res.status(500).json({
      status: "DOWN",
      database: dbStatus,
      timestamp: new Date()
    });
  }
});

// Production Frontend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("VENUS CARE API is running...");
  });
}

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

process.on("unhandledRejection", (err) => {
  console.error(`🔴 UNHANDLED REJECTION: ${err.message}`);
});

process.on("uncaughtException", (err) => {
  console.error(`🔴 UNCAUGHT EXCEPTION: ${err.message}`);
  process.exit(1);
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Start the review email reminder scheduler
  const { startReviewScheduler } = require("./utils/reviewScheduler.js");
  startReviewScheduler();
});
