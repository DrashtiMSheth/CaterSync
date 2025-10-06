// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const organiserRoutes = require("./routes/organiserRoutes");
const staffRoutes = require("./routes/staffRoutes");
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");

const app = express();

// =====================
// ✅ Middlewares
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS setup (for frontend integration)
app.use(cors({
  origin: "http://localhost:3000", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ Serve uploads folder
app.use("/uploads", express.static("uploads"));

// =====================
// ✅ Routes
// =====================
app.use("/api/auth", authRoutes);              // common auth (optional if using only organiser/staff)
app.use("/api/organiser", organiserRoutes);    // organiser registration/login/dashboard/events
app.use("/api/staff", staffRoutes); 
app.use("/api/organiser", otpRoutes);           // staff registration/login/dashboard/events/rating

// =====================
// ✅ MongoDB connection
// =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ DB connection error:", err));

// =====================
// ✅ Start server
// =====================
const PORT = process.env.PORT || 5050;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
