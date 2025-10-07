// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");           // For WebSocket server
const { Server } = require("socket.io");
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
app.use(helmet());

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
app.use("/api/auth", authRoutes);
app.use("/api/organiser", organiserRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/otp", otpRoutes);

// =====================
// ✅ Global Error Handler
// =====================
app.use(errorHandler);

// =====================
// ✅ MongoDB Connection
// =====================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => {
  console.error("❌ DB connection error:", err);
  process.exit(1);
});

// =====================
// ✅ HTTP & WebSocket Server
// =====================
const PORT = process.env.PORT || 5050;

// Wrap express app in HTTP server for WebSocket
const server = http.createServer(app);

// WebSocket server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("🟢 New WebSocket connected:", socket.id);

  socket.on("message", (data) => {
    console.log("📩 Message received:", data);
    // Optional: emit back to all clients
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 WebSocket disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`🚀 Server & WebSocket running on port ${PORT}`));
