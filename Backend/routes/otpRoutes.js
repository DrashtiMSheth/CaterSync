// routes/otpRoutes.js
const express = require("express");
const router = express.Router();

// Temporary in-memory storage for OTPs
// { "phone": { code: 123456, expires: timestamp } }
const otpStore = {};

// -----------------------
// Send OTP
// -----------------------
router.post("/send-otp", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone required" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const expires = Date.now() + 2 * 60 * 1000; // 2 minutes validity

    otpStore[phone] = { code, expires };

    console.log(`OTP for ${phone}: ${code}`); // Log OTP in console for testing

    // Send OTP in response (for frontend testing, no SMS needed)
    res.json({ message: "OTP sent successfully", otp: code });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Verify OTP
// -----------------------
router.post("/verify-otp", (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

  const record = otpStore[phone];
  if (!record) return res.status(400).json({ message: "OTP not found. Please request again." });

  if (Date.now() > record.expires) {
    delete otpStore[phone];
    return res.status(400).json({ message: "OTP expired. Please request again." });
  }

  if (parseInt(otp) !== record.code) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[phone];
  res.json({ message: "OTP verified successfully" });
});

module.exports = router;
