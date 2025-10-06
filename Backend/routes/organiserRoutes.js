// routes/organiserRoutes.js
const express = require("express");
const router = express.Router();
const organiserController = require("../controllers/organiserController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// =====================
// ✅ Ensure uploads folder exists
// =====================
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// =====================
// ✅ Multer setup for logo upload
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// =====================
// ✅ Public routes
// =====================
router.post("/register", upload.single("companyLogo"), organiserController.register);
router.post("/login", organiserController.login);

// =====================
// ✅ Protected routes (organiser only)
// =====================
router.get("/events", auth, role("organiser"), organiserController.getEvents);
router.post("/events", auth, role("organiser"), organiserController.createEvent);
router.get("/profile", auth, role("organiser"), organiserController.getProfile);
router.put("/profile", auth, role("organiser"), organiserController.updateProfile);

module.exports = router;
