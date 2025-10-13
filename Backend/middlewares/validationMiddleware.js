const { body, validationResult } = require("express-validator");

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

exports.userRegisterValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
];

exports.userLoginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.organiserRegisterValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone").trim().notEmpty().withMessage("Phone number is required"),
  body("organiserName").trim().notEmpty().withMessage("Organiser name is required"),
  body("businessType").trim().notEmpty().withMessage("Business type is required"),
];

exports.organiserLoginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

exports.createEventValidator = [
  body("name").trim().notEmpty().withMessage("Event name is required"),
  body("location.address").trim().notEmpty().withMessage("Event address is required"),
  body("location.lat").notEmpty().withMessage("Latitude is required").isFloat(),
  body("location.lng").notEmpty().withMessage("Longitude is required").isFloat(),
  body("startDateTime")
    .notEmpty()
    .withMessage("Start date & time is required")
    .isISO8601()
    .toDate(),
  body("endDateTime")
    .notEmpty()
    .withMessage("End date & time is required")
    .isISO8601()
    .toDate(),
  body("priority")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Priority must be an integer greater than 0"),
  body("requiredStaff")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Required staff count must be at least 1"),
];
