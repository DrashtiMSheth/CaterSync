const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");
const Event = require("../models/Event");
const path = require("path");

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

exports.register = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, password, role, skills = [],
      experience = "", address = "", lat, lng, availability = "",
      gender = "", languages = [],
    } = req.body;

    if (await Staff.findOne({ email }))
      return next({ statusCode: 400, message: "Email already registered" });

    const profilePic = req.file ? path.join("uploads", req.file.filename) : "";

    const newStaff = new Staff({
      fullName,
      email,
      phone,
      password,
      role: role || "staff",
      skills: Array.isArray(skills) ? skills : [skills],
      experience,
      location: { address, lat, lng },
      availability,
      gender,
      languages: Array.isArray(languages) ? languages : [languages],
      profilePic,
    });

    await newStaff.save();

    const token = jwt.sign(
      { id: newStaff._id, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    newStaff.password = undefined;

    res.status(201).json({ success: true, message: "Staff registered", staff: newStaff, token });
  } catch (err) {
    console.error("Staff register error:", err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
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

exports.getProfile = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });
    staff.password = undefined;
    res.json({ success: true, staff });
  } catch (err) {
    console.error("Get profile error:", err);
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const staff = await Staff.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });
    staff.password = undefined;
    res.json({ success: true, message: "Profile updated", staff });
  } catch (err) {
    console.error("Update profile error:", err);
    next(err);
  }
};

exports.getAvailableEvents = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    const events = await Event.find({ approved: true }).populate("organiser");
    const nearbyEvents = events.filter(event => {
      const distance = getDistanceKm(
        staff.location.lat,
        staff.location.lng,
        event.location.lat,
        event.location.lng
      );
      const alreadyApplied = event.applications.some(a => a.staff.toString() === staff._id.toString());
      return distance <= 10 && !alreadyApplied;
    });

    res.json({ success: true, events: nearbyEvents });
  } catch (err) {
    console.error("Get available events error:", err);
    next(err);
  }
};

exports.applyForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    const event = await Event.findById(eventId).populate("organiser");
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    const distance = getDistanceKm(staff.location.lat, staff.location.lng, event.location.lat, event.location.lng);
    if (distance > 10) return next({ statusCode: 403, message: "Event too far" });

    if (event.applications.some(a => a.staff.toString() === staff._id.toString()))
      return next({ statusCode: 400, message: "Already applied" });

    event.applications.push({ staff: staff._id, status: "pending" });
    await event.save();

    const io = req.app.get("io");
    if (io) {
      io.to(event.organiser._id.toString()).emit("new-application", {
        eventId: event._id,
        staffId: staff._id,
        staffName: staff.fullName,
      });
    }

    res.json({ success: true, message: "Applied successfully", event });
  } catch (err) {
    console.error("Apply error:", err);
    next(err);
  }
};

exports.cancelApplication = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    const event = await Event.findById(eventId).populate("organiser");
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    event.applications = event.applications.filter(a => a.staff.toString() !== staff._id.toString());
    await event.save();

    const io = req.app.get("io");
    if (io) {
      io.to(event.organiser._id.toString()).emit("application-cancelled", {
        eventId: event._id,
        staffId: staff._id,
        staffName: staff.fullName,
      });
    }

    res.json({ success: true, message: "Application cancelled", event });
  } catch (err) {
    console.error("Cancel error:", err);
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const staff = await Staff.findById(req.user.id);
    if (!staff) return next({ statusCode: 404, message: "Staff not found" });

    const events = await Event.find({ "applications.staff": staff._id }).populate("organiser", "fullName profilePic");

    const applications = events.map(event => {
      const app = event.applications.find(a => a.staff.toString() === staff._id.toString());
      return {
        eventId: event._id,
        eventName: event.name,
        organiser: event.organiser,
        status: app.status,
        appliedAt: app.appliedAt,
        attachments: event.attachments,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
      };
    });

    res.json({ success: true, applications });
  } catch (err) {
    console.error("Get applications error:", err);
    next(err);
  }
};

exports.rateStaff = async (req, res, next) => {
  res.json({ success: true, message: "Rate staff endpoint (to implement)" });
};

exports.getStaff = async (req, res, next) => {
  res.json({ success: true, message: "Get staff endpoint (to implement)" });
};
