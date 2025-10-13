const jwt = require("jsonwebtoken");
const Organiser = require("../models/Organiser");
const Event = require("../models/Event");
const Staff = require("../models/Staff");
const path = require("path");

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, organiserName, businessType, officeAddress = "", website = "" } = req.body;

    if (await Organiser.findOne({ email }))
      return next({ statusCode: 400, message: "Email already registered" });

    const logo = req.file ? path.join("uploads", req.file.filename) : "";

    const newOrg = new Organiser({
      fullName, email, phone, password,
      organiserName, businessType, officeAddress, website, logo
    });

    await newOrg.save();

    const token = jwt.sign({ id: newOrg._id, role: "organiser" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    newOrg.password = undefined;

    res.status(201).json({ success: true, message: "Organiser registered", organiser: newOrg, token });
  } catch (err) {
    console.error("Organiser register error:", err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const org = await Organiser.findOne({ email });
    if (!org) return next({ statusCode: 400, message: "Invalid credentials" });

    const isMatch = await org.comparePassword(password);
    if (!isMatch) return next({ statusCode: 400, message: "Invalid credentials" });

    const token = jwt.sign({ id: org._id, role: "organiser" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    org.password = undefined;

    res.json({ success: true, message: "Login successful", organiser: org, token });
  } catch (err) {
    console.error("Organiser login error:", err);
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const organiser = await Organiser.findById(req.user.id);
    if (!organiser) return next({ statusCode: 404, message: "Organiser not found" });

    organiser.password = undefined;
    res.json({ success: true, organiser });
  } catch (err) {
    console.error("Get organiser profile error:", err);
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const organiser = await Organiser.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!organiser) return next({ statusCode: 404, message: "Organiser not found" });

    organiser.password = undefined;
    res.json({ success: true, message: "Profile updated", organiser });
  } catch (err) {
    console.error("Update organiser profile error:", err);
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const { name, description = "", location, startDateTime, endDateTime, priority = 1, requiredStaff = 1, attachments = [] } = req.body;

    if (!name || !location?.address || !location?.lat || !location?.lng || !startDateTime || !endDateTime) {
      return next({ statusCode: 400, message: "Missing required fields" });
    }

    const newEvent = new Event({
      name,
      description,
      location,
      startDateTime,
      endDateTime,
      priority,
      requiredStaff,
      organiser: req.user.id,
      attachments,
      approved: true,
      applications: []
    });

    await newEvent.save();
    res.status(201).json({ success: true, message: "Event created successfully", event: newEvent });
  } catch (err) {
    console.error("Create event error:", err);
    next(err);
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organiser: req.user.id })
      .populate("applications.staff", "fullName email phone profilePic")
      .sort({ startDateTime: 1 });
    res.json({ success: true, events });
  } catch (err) {
    console.error("Get events error:", err);
    next(err);
  }
};

exports.handleApplication = async (req, res, next) => {
  try {
    const { eventId, staffId, action } = req.body;

    const event = await Event.findById(eventId).populate("organiser");
    if (!event) return next({ statusCode: 404, message: "Event not found" });
    if (event.organiser._id.toString() !== req.user.id) return next({ statusCode: 403, message: "Unauthorized" });

    const app = event.applications.find(a => a.staff.toString() === staffId);
    if (!app) return next({ statusCode: 404, message: "Application not found" });
    if (!["accept", "reject"].includes(action)) return next({ statusCode: 400, message: "Invalid action" });

    app.status = action === "accept" ? "accepted" : "rejected";
    await event.save();

    const io = req.app.get("io");
    if (io) {
      io.to(staffId).emit("application-status-changed", { eventId, status: app.status });
    }

    res.json({ success: true, message: `Application ${app.status}`, event });
  } catch (err) {
    console.error("Handle application error:", err);
    next(err);
  }
};

exports.getEventApplications = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("applications.staff", "fullName email phone profilePic");
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    res.json({ success: true, applications: event.applications });
  } catch (err) {
    console.error("Get event applications error:", err);
    next(err);
  }
};
