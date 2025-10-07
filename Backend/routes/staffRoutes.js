const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const upload = require("../middlewares/upload");
const {
  validate,
  userRegisterValidator,
  userLoginValidator,
} = require("../middlewares/validationMiddleware");

// =====================
// ✅ Public Routes
// =====================

// Staff registration
router.post(
  "/register",
  upload.single("profilePic"),
  userRegisterValidator,
  validate,
  staffController.register
);

// Staff login
router.post(
  "/login",
  userLoginValidator,
  validate,
  staffController.login
);

// =====================
// ✅ Protected Routes (staff only)
// =====================

// Get staff profile
router.get("/profile", auth, role("staff"), staffController.getProfile);

// Update staff profile
router.put("/profile", auth, role("staff"), staffController.updateProfile);

// Get events assigned to staff
router.get("/events", auth, role("staff"), staffController.getStaffEvents);

// =====================
// ✅ Routes for organisers (staff management)
// =====================

// Rate a staff member
router.post(
  "/:staffId/rate",
  auth,
  role("organiser"),
  staffController.rateStaff
);

// Get all staff (organiser can filter nearby)
router.get("/", auth, role("organiser"), staffController.getStaff);

module.exports = router;
