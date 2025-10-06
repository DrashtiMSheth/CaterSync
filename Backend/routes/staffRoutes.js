// routes/staffRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const staffController = require("../controllers/staffController");

// =====================
// ✅ Ensure uploads folder exists
// =====================
const uploadDir = path.join(__dirname, "..", "uploads");
const fs = require("fs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// =====================
// ✅ Multer setup for profile picture
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// =====================
// ✅ Public routes
// =====================
router.post("/register", upload.single("profilePic"), staffController.register);
router.post("/login", staffController.login);

// =====================
// ✅ Protected routes (staff only)
// =====================
router.get("/profile", auth, role("staff"), staffController.getProfile);
router.put("/profile", auth, role("staff"), staffController.updateProfile);
router.get("/events", auth, role("staff"), staffController.getStaffEvents);

// Optional: For organisers to rate staff
router.post("/:staffId/rate", auth, role("organiser"), staffController.rateStaff);

// Optional: Get all staff (nearby filter can be used by organiser)
router.get("/", auth, role("organiser"), staffController.getStaff);

module.exports = router;
