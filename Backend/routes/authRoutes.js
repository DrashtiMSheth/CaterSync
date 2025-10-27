const express = require("express");
const path = require("path");
const multer = require("multer");

const organiserController = require("../controllers/organiserController");
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth");
const {
  userRegisterValidator,
  userLoginValidator,
  organiserRegisterValidator,
  organiserLoginValidator,
} = require("../middlewares/validationMiddleware");
const { validationResult } = require("express-validator");

const router = express.Router();

// ✅ Multer setup for profilePic upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // make sure "uploads" folder exists at project root
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit: 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only .jpg, .jpeg and .png files are allowed"));
    }
    cb(null, true);
  },
});

// ✅ Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// ✅ Organiser Routes
router.post("/organiser/register", organiserRegisterValidator, validate, organiserController.register);
router.post("/organiser/login", organiserLoginValidator, validate, organiserController.login);
router.get("/organiser/profile", auth, organiserController.getProfile);
router.put("/organiser/profile", auth, organiserController.updateProfile);

// ✅ Staff Routes
router.post(
  "/staff/register",
  upload.single("profilePic"), // 👈 handles FormData field "profilePic"
  userRegisterValidator,
  validate,
  staffController.register
);

router.post("/staff/login", userLoginValidator, validate, staffController.login);
router.get("/staff/profile", auth, staffController.getProfile);
router.put("/staff/profile", auth, staffController.updateProfile);

// ✅ Optional OTP Route (for organiser)
router.post("/organiser/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expires = Date.now() + 2 * 60 * 1000; // 2 minutes

    global.otpStore = global.otpStore || {};
    otpStore[phone] = { code, expires };

    console.log(`OTP for ${phone}: ${code}`);
    res.json({ message: "OTP sent successfully", otp: code });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
