const express = require("express");
const organiserController = require("../controllers/organiserController");
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth"); // JWT verification middleware
const { validationResult } = require("express-validator");
const {
  userRegisterValidator,
  userLoginValidator,
  organiserRegisterValidator,
  organiserLoginValidator,
} = require("../middlewares/validationMiddleware");

const router = express.Router();

// ✅ Helper middleware to handle validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

// =====================
// ORGANISER ROUTES
// =====================

// Register organiser
router.post(
  "/organiser/register",
  organiserRegisterValidator,
  validate,
  organiserController.register
);

// Login organiser
router.post(
  "/organiser/login",
  organiserLoginValidator,
  validate,
  organiserController.login
);

// Get organiser profile (requires JWT)
router.get("/organiser/profile", auth, organiserController.getProfile);

// Update organiser profile (requires JWT)
router.put("/organiser/profile", auth, organiserController.updateProfile);

// =====================
// STAFF ROUTES
// =====================

// Register staff
router.post("/staff/register", userRegisterValidator, validate, staffController.register);

// Login staff
router.post("/staff/login", userLoginValidator, validate, staffController.login);

// Get staff profile (requires JWT)
router.get("/staff/profile", auth, staffController.getProfile);

// Update staff profile (requires JWT)
router.put("/staff/profile", auth, staffController.updateProfile);

module.exports = router;
