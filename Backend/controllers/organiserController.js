// controllers/organiserController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Organiser = require("../models/Organiser");
const Event = require("../models/Event");
const path = require("path");

// =====================
// ✅ REGISTER ORGANISER
// =====================
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      organiserName,
      businessType,
      officeAddress,
      website,
      otp,
      terms,
    } = req.body;

    // Required fields
    if (!fullName || !email || !phone || !password || !organiserName || !businessType)
      return res.status(400).json({ message: "Please fill all required fields" });

    if (!terms || terms === "false") return res.status(400).json({ message: "Accept Terms & Conditions" });
    if (!otp) return res.status(400).json({ message: "Missing OTP" });

    const existing = await Organiser.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let logoPath = null;
    if (req.file) logoPath = path.join("uploads", req.file.filename);

    const newOrg = new Organiser({
      fullName,
      email,
      phone,
      password: hashedPassword,
      organiserName,
      businessType,
      officeAddress: officeAddress || "",
      website: website || "",
      logo: logoPath,
    });

    await newOrg.save();

    const token = jwt.sign({ id: newOrg._id, role: "organizer" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    newOrg.password = undefined;

    res.status(201).json({ message: "Organiser registered successfully", user: newOrg, token });
  } catch (err) {
    console.error("Organiser register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ LOGIN ORGANISER
// =====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const org = await Organiser.findOne({ email });
    if (!org) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, org.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: org._id, role: "organizer" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    org.password = undefined;

    res.json({ message: "Login successful", user: org, token });
  } catch (err) {
    console.error("Organiser login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET ORGANISER PROFILE
// =====================
exports.getProfile = async (req, res) => {
  try {
    const organiser = await Organiser.findById(req.user.id);
    if (!organiser) return res.status(404).json({ message: "Organiser not found" });
    organiser.password = undefined;
    res.json(organiser);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ UPDATE ORGANISER PROFILE
// =====================
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const organiser = await Organiser.findByIdAndUpdate(req.user.id, updates, { new: true });
    organiser.password = undefined;
    res.json({ message: "Profile updated", organiser });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ CREATE EVENT
// =====================
exports.createEvent = async (req, res) => {
  try {
    const { name, date, priority, required, lat, lon } = req.body;
    if (!name || !date || !priority || !required || !lat || !lon)
      return res.status(400).json({ message: "Please fill all fields" });

    const newEvent = new Event({
      name,
      date,
      priority,
      required,
      applied: 0,
      lat,
      lon,
      organiser: req.user.id,
      approved: true, // set to false if admin approval is required
      staffAssigned: [],
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET ALL ORGANISER EVENTS
// =====================
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ organiser: req.user.id })
      .populate("staffAssigned", "fullName email phone role")
      .sort({ date: 1 });
    res.json({ events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ ASSIGN STAFF TO EVENT
// =====================
exports.assignStaff = async (req, res) => {
  try {
    const { eventId, staffIds } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organiser.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    event.staffAssigned = staffIds;
    await event.save();

    res.json({ success: true, message: "Staff assigned successfully", event });
  } catch (err) {
    console.error("Assign staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ UPDATE EVENT
// =====================
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organiser.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    Object.assign(event, req.body);
    await event.save();

    res.json({ success: true, message: "Event updated", event });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ DELETE EVENT
// =====================
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.organiser.toString() !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });

    await event.remove();
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =====================
// ✅ GET EVENTS FOR STAFF DASHBOARD
// =====================
exports.getStaffEvents = async (req, res) => {
  try {
    if (req.user.role !== "staff") return res.status(403).json({ message: "Unauthorized" });

    const today = new Date();
    const events = await Event.find({ staffAssigned: req.user.id, approved: true });

    const currentEvents = events.filter(e => new Date(e.date) <= today);
    const upcomingEvents = events.filter(e => new Date(e.date) > today);

    res.json({ success: true, currentEvents, upcomingEvents });
  } catch (err) {
    console.error("Get staff events error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
