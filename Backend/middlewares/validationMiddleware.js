const { body, validationResult } = require("express-validator");

// =====================
// ✅ Middleware to handle validation results
// =====================
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// =====================
// ✅ Staff / User Validators
// =====================
exports.userRegisterValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").notEmpty().withMessage("Phone number is required"),
];

exports.userLoginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// =====================
// ✅ Organiser Validators
// =====================
exports.organiserRegisterValidator = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  body("organiserName").notEmpty().withMessage("Organiser name is required"),
  body("businessType").notEmpty().withMessage("Business type is required"),
];

exports.organiserLoginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// =====================
// ✅ Event creation validator
// =====================
exports.createEventValidator = [
  body("name").notEmpty().withMessage("Event name is required"),
  body("date")
    .notEmpty()
    .withMessage("Event date is required")
    .isISO8601()
    .toDate(),
  body("priority")
    .notEmpty()
    .withMessage("Priority is required")
    .isInt({ min: 1 }),
  body("required")
    .notEmpty()
    .withMessage("Required staff count is required")
    .isInt({ min: 1 }),
  body("lat")
    .notEmpty()
    .withMessage("Latitude is required")
    .isFloat(),
  body("lon")
    .notEmpty()
    .withMessage("Longitude is required")
    .isFloat(),
];
