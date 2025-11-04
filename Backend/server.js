require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Routes
const organiserRoutes = require("./routes/organiserRoutes");
const eventRoutes = require("./routes/eventRoutes");
const staffRoutes = require("./routes/staffRoutes");
const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");

// Middlewares
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const server = http.createServer(app);

// ✅ Connect to MongoDB
connectDB();

// ✅ Security & Body Parsing Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Allowed frontend origins (local + deployed)
const FE_ORIGIN =
  process.env.FE_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://location-frontend-delta.vercel.app"
    : "http://localhost:3000");

// ✅ CORS Configuration
// app.use(
//   cors({
//     origin: FE_ORIGIN,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
//     credentials: true, // allow cookies/tokens
//   })
// );
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = ["http://localhost:3000", "http://localhost:5001"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));


// ✅ Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: FE_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);
global.io = io;

// ✅ Attach io instance to each request for controllers to emit
app.use((req, res, next) => { req.io = io; next(); });

// ✅ API Routes (mounted after io is available on req)
app.use("/api/auth", authRoutes);
app.use("/api/organiser", organiserRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/otp", otpRoutes);

// ✅ Error Handling Middleware
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("🟢 WebSocket connected:", socket.id);

  socket.on("joinRoom", ({ userId }) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room ${userId}`);
  });

  socket.on("message", (data) => {
    console.log("📩 Message received:", data);
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 WebSocket disconnected:", socket.id);
  });
});

// ✅ Start the server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server & WebSocket running on port ${PORT}`);
});
