const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Organiser = require("../models/Organiser");
const Event = require("../models/Event");
const Staff = require("../models/Staff");


// ================== REGISTER ==================
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, organiserName, businessType, officeAddress = "", website = "" } = req.body;

    // Prevent duplicate email/phone
    const existing = await Organiser.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      if (existing.email === email)
        return next({ statusCode: 400, message: "Email already registered" });
      if (existing.phone === phone)
        return next({ statusCode: 400, message: "Phone already registered" });
    }

    const companyLogo = req.file ? path.join("uploads", req.file.filename) : "";

    const newOrg = new Organiser({
      fullName,
      email,
      phone,
      password,
      organiserName,
      businessType,
      officeAddress,
      website,
      companyLogo,
    });

    await newOrg.save();

    const token = jwt.sign({ id: newOrg._id, role: "organiser" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    newOrg.password = undefined;

    res.status(201).json({
      success: true,
      message: "Organiser registered successfully",
      organiser: newOrg,
      token,
    });
  } catch (err) {
    console.error("Organiser register error:", err);
    next(err);
  }
};


// ================== LOGIN ==================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const org = await Organiser.findOne({ email });
    if (!org) return next({ statusCode: 400, message: "Invalid email" });

    const isMatch = await org.comparePassword(password);
    if (!isMatch) return next({ statusCode: 400, message: "Invalid password" });

    const token = jwt.sign({ id: org._id, role: "organiser" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    org.password = undefined;

    res.json({ success: true, message: "Login successful", organiser: org, token });
  } catch (err) {
    console.error("Organiser login error:", err);
    next(err);
  }
};


// ================== GET PROFILE ==================
exports.getProfile = async (req, res, next) => {
  try {
    const organiser = await Organiser.findById(req.user.id).select("-password");
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    res.json({
      success: true,
      organiser,
    });
  } catch (err) {
    console.error("Get organiser profile error:", err);
    next(err);
  }
};


// ================== UPDATE PROFILE ==================
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;

    if (req.file) {
      updates.companyLogo = path.join("uploads", req.file.filename);

      // Remove old logo if it exists
      const existing = await Organiser.findById(req.user.id);
      if (existing && existing.companyLogo && fs.existsSync(existing.companyLogo)) {
        fs.unlinkSync(existing.companyLogo);
      }
    }

    const organiser = await Organiser.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!organiser) {
      return next({ statusCode: 404, message: "Organiser not found" });
    }

    organiser.password = undefined;

    res.json({
      success: true,
      message: "Profile updated successfully",
      organiser,
    });
  } catch (err) {
    console.error("Update organiser profile error:", err);
    next(err);
  }
};


// ================== CREATE EVENT ==================
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
      applications: [],
    });

    await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (err) {
    console.error("Create event error:", err);
    next(err);
  }
};


// ================== GET EVENTS ==================
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


// ================== HANDLE APPLICATION ==================
exports.handleApplication = async (req, res, next) => {
  try {
    const { eventId, staffId, action } = req.body;

    const event = await Event.findById(eventId).populate("organiser");
    if (!event) return next({ statusCode: 404, message: "Event not found" });
    if (event.organiser._id.toString() !== req.user.id)
      return next({ statusCode: 403, message: "Unauthorized" });

    const app = event.applications.find(a => a.staff.toString() === staffId);
    if (!app) return next({ statusCode: 404, message: "Application not found" });

    if (!["accept", "reject"].includes(action))
      return next({ statusCode: 400, message: "Invalid action" });

    app.status = action === "accept" ? "accepted" : "rejected";
    await event.save();

    const io = req.app.get("io");
    if (io) {
      io.to(staffId).emit("application-status-changed", {
        eventId,
        status: app.status,
      });
    }

    res.json({
      success: true,
      message: `Application ${app.status}`,
      event,
    });
  } catch (err) {
    console.error("Handle application error:", err);
    next(err);
  }
};


// ================== GET EVENT APPLICATIONS ==================
exports.getEventApplications = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate(
      "applications.staff",
      "fullName email phone profilePic"
    );

    if (!event) return next({ statusCode: 404, message: "Event not found" });

    res.json({ success: true, applications: event.applications });
  } catch (err) {
    console.error("Get event applications error:", err);
    next(err);
  }
};
