const jwt = require("jsonwebtoken");
const Organiser = require("../models/Organiser");
const Event = require("../models/Event");
const path = require("path");

// =====================
// ✅ REGISTER ORGANISER
// =====================
exports.register = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, password,
      organiserName, businessType, officeAddress, website
    } = req.body;

    // Check if email already exists
    const existing = await Organiser.findOne({ email });
    if (existing) return next({ statusCode: 400, message: "Email already registered" });

    const logoPath = req.file ? path.join("uploads", req.file.filename) : null;

    const newOrg = new Organiser({
      fullName, email, phone, password,
      organiserName, businessType,
      officeAddress: officeAddress || "",
      website: website || "",
      logo: logoPath
    });

    await newOrg.save();

    const token = jwt.sign(
      { id: newOrg._id, role: "organiser" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    newOrg.password = undefined;
    res.status(201).json({ message: "Organiser registered successfully", user: newOrg, token });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ LOGIN ORGANISER
// =====================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const org = await Organiser.findOne({ email });
    if (!org) return next({ statusCode: 400, message: "Invalid credentials" });

    const isMatch = await org.comparePassword(password);
    if (!isMatch) return next({ statusCode: 400, message: "Invalid credentials" });

    const token = jwt.sign({ id: org._id, role: "organiser" }, process.env.JWT_SECRET, { expiresIn: "1d" });

    org.password = undefined;
    res.json({ message: "Login successful", user: org, token });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ GET ORGANISER PROFILE
// =====================
exports.getProfile = async (req, res, next) => {
  try {
    const organiser = await Organiser.findById(req.user.id);
    if (!organiser) return next({ statusCode: 404, message: "Organiser not found" });
    organiser.password = undefined;
    res.json({ organiser });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ UPDATE ORGANISER PROFILE
// =====================
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const organiser = await Organiser.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!organiser) return next({ statusCode: 404, message: "Organiser not found" });
    organiser.password = undefined;
    res.json({ message: "Profile updated", organiser });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ CREATE EVENT
// =====================
exports.createEvent = async (req, res, next) => {
  try {
    const { name, date, priority = 1, required = 1, lat, lon } = req.body;

    if (!name || !date || !lat || !lon) {
      return next({ statusCode: 400, message: "Missing required fields" });
    }

    const newEvent = new Event({
      name, date, priority, required,
      lat, lon,
      organiser: req.user.id,
      approved: true,
      staffAssigned: [],
      applied: 0
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ GET ALL ORGANISER EVENTS
// =====================
exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organiser: req.user.id })
      .populate("staffAssigned", "fullName email phone role")
      .sort({ date: 1 });

    res.json({ events });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ ASSIGN STAFF TO EVENT
// =====================
exports.assignStaff = async (req, res, next) => {
  try {
    const { eventId, staffIds } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    event.staffAssigned = staffIds;
    await event.save();

    res.json({ success: true, message: "Staff assigned successfully", event });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ UPDATE EVENT
// =====================
exports.updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({ success: true, message: "Event updated", event });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ DELETE EVENT
// =====================
exports.deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    await event.remove();
    res.json({ success: true, message: "Event deleted" });
  } catch (err) {
    next(err);
  }
};
