// controllers/staffController.js
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const Event = require("../models/Event");
const path = require("path");

// =====================
// ✅ REGISTER STAFF
// =====================
exports.register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role,
      skills = [],
      experience,
      address,
      lat,
      lng,
      availability,
      gender,
      languages,
    } = req.body;

    // Validation already handled via express-validator in routes

    // Check if email exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) return next({ statusCode: 400, message: "Email already registered" });

    // Handle profile picture
    const profilePicPath = req.file ? path.join("uploads", req.file.filename) : null;

    // Create new staff (password hashing handled in model pre-save hook)
    const newStaff = new Staff({
      fullName,
      email,
      phone,
      password,
      role: role || "staff",
      skills: Array.isArray(skills) ? skills : [skills],
      experience: experience || "",
      location: { address, lat, lng },
      availability,
      gender: gender || "",
      languages: languages || "",
      profilePic: profilePicPath,
    });

    await newStaff.save();

    // Generate JWT token
    const token = jwt.sign({ id: newStaff._id, role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    newStaff.password = undefined;

    res.status(201).json({ success: true, message: "Staff registered successfully", staff: newStaff, token });
  } catch (err) {
    console.error("Staff register error:", err);
    next(err);
  }
};

// =====================
// ✅ LOGIN STAFF
// =====================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation handled via express-validator
    const staff = await Staff.findOne({ email });
    if (!staff) return next({ statusCode: 400, message: "Invalid credentials" });

    const isMatch = await staff.comparePassword(password);
    if (!isMatch) return next({ statusCode: 400, message: "Invalid credentials" });

    const token = jwt.sign({ id: staff._id, role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    staff.password = undefined;

    res.json({ success: true, message: "Login successful", staff, token });
  } catch (err) {
    console.error("Staff login error:", err);
    next(err);
  }
};

// =====================
// ✅ GET STAFF PROFILE
// =====================
exports.getProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    staff.password = undefined;
    res.json({ success: true, staff });
  } catch (err) {
    console.error("Get staff profile error:", err);
    next(err);
  }
};

// =====================
// ✅ UPDATE STAFF PROFILE
// =====================
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;

    const staff = await Staff.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    staff.password = undefined;
    res.json({ success: true, message: "Profile updated", staff });
  } catch (err) {
    console.error("Update staff profile error:", err);
    next(err);
  }
};

// =====================
// ✅ GET EVENTS ASSIGNED TO STAFF
// =====================
exports.getStaffEvents = async (req, res, next) => {
  try {
    if (!req.user.id) return next({ statusCode: 400, message: "Invalid user" });

    const today = new Date();
    const events = await Event.find({ staffAssigned: req.user.id, approved: true });

    const currentEvents = events.filter(e => new Date(e.date) <= today);
    const upcomingEvents = events.filter(e => new Date(e.date) > today);

    res.json({ success: true, currentEvents, upcomingEvents });
  } catch (err) {
    console.error("Get staff events error:", err);
    next(err);
  }
};

// =====================
// ✅ RATE STAFF (Organiser only)
// =====================
exports.rateStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const { rating } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    // Initialize ratings array if not exists
    if (!staff.ratings) staff.ratings = [];

    staff.ratings.push({ organiser: req.user.id, rating });
    await staff.save();

    res.json({ success: true, message: "Staff rated successfully", staff });
  } catch (err) {
    console.error("Rate staff error:", err);
    next(err);
  }
};

// =====================
// ✅ GET ALL STAFF (Organiser only)
// =====================
exports.getStaff = async (req, res, next) => {
  try {
    const staffList = await Staff.find();
    res.json({ success: true, staff: staffList });
  } catch (err) {
    console.error("Get all staff error:", err);
    next(err);
  }
};
