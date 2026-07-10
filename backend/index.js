const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db.js");
const path = require("path");

dotenv.config();

connectDB();

const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
});

app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    message: "Too many authentication requests from this IP, please try again after 15 minutes."
  }
});

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

// Body Parser
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/address", require("./routes/addressRoutes"));
app.use("/api/otp", authLimiter, require("./routes/otpRoutes"));
app.use("/api/email-otp", authLimiter, require("./routes/emailOtpRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
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

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("VENUS CARE API is running...");
  });
}

// Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message,
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

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
