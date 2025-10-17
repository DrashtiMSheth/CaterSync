const express = require("express");
const router = express.Router();

const otpStore = {}; // Temporary in-memory storage (use DB in production)

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// ⏳ Cooldown in milliseconds (e.g., 30 seconds before resend allowed)
const RESEND_COOLDOWN = 30 * 1000;

// 📩 SEND OTP
router.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  try {
    const code = generateOTP();
    const expires = Date.now() + 2 * 60 * 1000; // Valid for 2 minutes
    const otpToken = `otp_${phone}_${Date.now()}`;
    const nextResendTime = Date.now() + RESEND_COOLDOWN;

    otpStore[phone] = { code, expires, otpToken, nextResendTime };

    console.log(`📱 OTP for ${phone}: ${code}`);

    res.json({
      message: "OTP sent successfully",
      otp: code, // ⚠️ For testing only — remove in production
      otpToken,
    });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔁 RESEND OTP
router.post("/resend-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone number is required" });

  const record = otpStore[phone];

  // If no OTP previously sent
  if (!record) return res.status(400).json({ message: "Please request an OTP first." });

  // Check cooldown
  if (Date.now() < record.nextResendTime) {
    const waitSeconds = Math.ceil((record.nextResendTime - Date.now()) / 1000);
    return res.status(400).json({ message: `Please wait ${waitSeconds}s before resending.` });
  }

  // Generate new OTP
  const newCode = generateOTP();
  const newExpires = Date.now() + 2 * 60 * 1000;
  const newOtpToken = `otp_${phone}_${Date.now()}`;
  const nextResendTime = Date.now() + RESEND_COOLDOWN;

  otpStore[phone] = { code: newCode, expires: newExpires, otpToken: newOtpToken, nextResendTime };

  console.log(`🔁 Resent OTP for ${phone}: ${newCode}`);

  res.json({
    message: "OTP resent successfully",
    otp: newCode, // ⚠️ For testing only
    otpToken: newOtpToken,
  });
});

// ✅ VERIFY OTP
router.post("/verify-otp", (req, res) => {
  const { phone, otp, otpToken } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

  const record = otpStore[phone];
  if (!record) return res.status(400).json({ message: "OTP not found. Please request again." });

  // Check expiry
  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.status(400).json({ message: "OTP expired. Please request again." });
  }

  // Check token validity (optional)
  if (otpToken && record.otpToken !== otpToken) {
    return res.status(400).json({ message: "Invalid OTP token" });
  }

  // Check OTP code
  if (parseInt(otp) !== record.code) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[phone];
  res.json({ message: "OTP verified successfully" });
});

module.exports = router;
