// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const organiserRoutes = require("./routes/organiserRoutes");
const staffRoutes = require("./routes/staffRoutes");
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// =====================
// ✅ Security Middleware
// =====================
app.use(helmet()); // sets HTTP headers for security

// =====================
// ✅ Middlewares
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:3000", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Serve uploads folder for static files
app.use("/uploads", express.static("uploads"));

// =====================
// ✅ Routes
// =====================
app.use("/api/auth", authRoutes);             // common auth routes
app.use("/api/organiser", organiserRoutes);   // organiser routes
app.use("/api/staff", staffRoutes);           // staff routes
app.use("/api/otp", otpRoutes);               // otp-related routes

// =====================
// ✅ Global Error Handler
// =====================
app.use(errorHandler);

// =====================
// ✅ MongoDB Connection
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  });

// =====================
// ✅ Start Server
// =====================
const PORT = process.env.PORT || 5050;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
