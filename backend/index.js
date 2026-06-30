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
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
});

app.use(limiter);

// CORS
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL],
    credentials: true,
  }),
);

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
app.use("/api/otp", require("./routes/otpRoutes"));
app.use("/api/email-otp", require("./routes/emailOtpRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
// Production Frontend
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("ELYSORIA API is running...");
  });
}

// Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message,
  });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
