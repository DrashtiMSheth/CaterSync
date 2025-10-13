const express = require("express");
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

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.post(
  "/organiser/register",
  organiserRegisterValidator,
  validate,
  organiserController.register
);

router.post(
  "/organiser/login",
  organiserLoginValidator,
  validate,
  organiserController.login
);

router.get("/organiser/profile", auth, organiserController.getProfile);

router.put("/organiser/profile", auth, organiserController.updateProfile);

router.post("/staff/register", userRegisterValidator, validate, staffController.register);

router.post("/staff/login", userLoginValidator, validate, staffController.login);

router.get("/staff/profile", auth, staffController.getProfile);

router.put("/staff/profile", auth, staffController.updateProfile);

router.post("/organiser/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  try {
    const code = generateOTP();
    const expires = Date.now() + 2 * 60 * 1000; 

    otpStore[phone] = { code, expires };

    console.log(`OTP for ${phone}: ${code}`); 

    res.json({ message: "OTP sent successfully", otp: code });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
