// routes/authRoutes.js
const express = require("express");
const organiserController = require("../controllers/organiserController");
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth"); // JWT verification middleware

const router = express.Router();

// =====================
// ORGANISER ROUTES
// =====================

// Register organiser
router.post("/organiser/register", organiserController.register);

// Login organiser
router.post("/organiser/login", organiserController.login);

// Get organiser profile (requires JWT)
router.get("/organiser/profile", auth, organiserController.getProfile);

// Update organiser profile (requires JWT)
router.put("/organiser/profile", auth, organiserController.updateProfile);

// =====================
// STAFF ROUTES
// =====================

// Register staff
router.post("/staff/register", staffController.register);

// Login staff
router.post("/staff/login", staffController.login);

// Get staff profile (requires JWT)
router.get("/staff/profile", auth, staffController.getProfile);

// Update staff profile (requires JWT)
router.put("/staff/profile", auth, staffController.updateProfile);

module.exports = router;
