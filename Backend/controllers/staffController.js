const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const Event = require("../models/Event");
const path = require("path");

// =====================
// ✅ REGISTER STAFF
// =====================
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, role, skills = [], experience, address, lat, lng, availability, gender, languages, otp, terms } = req.body;

    if (!fullName || !email || !phone || !password || !role || !address || !lat || !lng || !availability)
      return res.status(400).json({ message: "Please fill all required fields" });

    if (!terms || terms === false || terms === "false") return res.status(400).json({ message: "Please accept Terms & Conditions" });
    if (!otp) return res.status(400).json({ message: "Missing OTP" });

    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    let profilePicPath = req.file ? path.join("uploads", req.file.filename) : null;

    const newStaff = new Staff({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role,
      skills: Array.isArray(skills) ? skills : [skills],
      experience: experience || "",
      location: { address, lat, lng },
      availability,
      gender: gender || "",
      languages: languages || "",
      profilePic: profilePicPath,
    });

    await newStaff.save();

    const token = jwt.sign({ id: newStaff._id, role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    newStaff.password = undefined;

    res.status(201).json({ message: "Staff registered successfully", staff: newStaff, token });
  } catch (err) {
    console.error("Staff register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =====================
// ✅ LOGIN STAFF
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const staff = await Staff.findOne({ email });
    if (!staff) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: staff._id, role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    staff.password = undefined;

    res.json({ message: "Login successful", staff, token });
  } catch (err) {
    console.error("Staff login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET STAFF PROFILE
// =====================
exports.getProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    staff.password = undefined;
    res.json(staff);
  } catch (err) {
    console.error("Get staff profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ UPDATE STAFF PROFILE
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const staff = await Staff.findByIdAndUpdate(req.user.id, updates, { new: true });
    staff.password = undefined;
    res.json({ message: "Profile updated", staff });
  } catch (err) {
    console.error("Update staff profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET ALL STAFF (OPTIONAL NEARBY FILTER)
// =====================
exports.getStaff = async (req, res) => {
  try {
    const { lat, lng, distance } = req.query;
    let staff = await Staff.find();

    if (lat && lng && distance) {
      const R = 6371;
      staff = staff.filter(s => {
        const dLat = ((s.location.lat - lat) * Math.PI) / 180;
        const dLon = ((s.location.lng - lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos((lat * Math.PI) / 180) *
                  Math.cos((s.location.lat * Math.PI) / 180) *
                  Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c <= distance;
      });
    }

    res.json(staff);
  } catch (err) {
    console.error("Get staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ RATE STAFF (BY ORGANISER)
// =====================
exports.rateStaff = async (req, res) => {
  try {
    const staffId = req.params.staffId;
    const { rating, payment, method, comments } = req.body;
    if (!rating || !payment || !method) return res.status(400).json({ message: "Please fill rating, payment, and method" });

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    staff.rating = rating;
    staff.payment = payment;
    staff.method = method;
    staff.comments = comments || "";
    await staff.save();

    res.json({ message: "Staff rated successfully", staff });
  } catch (err) {
    console.error("Rate staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET EVENTS ASSIGNED TO STAFF
// =====================
exports.getStaffEvents = async (req, res) => {
  try {
    const today = new Date();
    const events = await Event.find({ staffAssigned: req.user.id, approved: true });

    const currentEvents = events.filter(e => new Date(e.date) <= today);
    const upcomingEvents = events.filter(e => new Date(e.date) > today);

    res.json({ currentEvents, upcomingEvents });
  } catch (err) {
    console.error("Get staff events error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
