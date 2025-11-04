const Event = require("../models/Event");
const Staff = require("../models/Staff");
const mongoose = require("mongoose");

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

exports.createEvent = async (req, res, next) => {
  try {
    const { name, description, location, startDateTime, endDateTime, priority = 1, requiredStaff = 1, attachments = [] } = req.body;

    if (!name || !location?.address || !location?.lat || !location?.lng || !startDateTime || !endDateTime) {
      return next({ statusCode: 400, message: "Required fields missing" });
    }

    if (!["organiser", "admin"].includes(req.user.role)) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const newEvent = new Event({
      name,
      description: description || "",
      location,
      startDateTime,
      endDateTime,
      priority,
      requiredStaff,
      organiser: req.user.id,
      approved: false,
      attachments,
      applications: [],
      ratings: []
    });

    await newEvent.save();

    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    next(err);
  }
};

exports.applyForEvent = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") return next({ statusCode: 403, message: "Unauthorized" });

    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    const distance = getDistanceFromLatLonInKm(
      req.user.location.lat,
      req.user.location.lng,
      event.location.lat,
      event.location.lng
    );
    if (distance > 10) return next({ statusCode: 403, message: "Too far from event" });

    const alreadyApplied = event.applications.find(a => a.staff.toString() === req.user.id);
    if (alreadyApplied) return next({ statusCode: 400, message: "Already applied for this event" });

    event.applications.push({ staff: req.user.id });
    await event.save();

    req.io.to(event.organiser.toString()).emit("notification", { type: "newApplication", eventId, staffId: req.user.id });
    req.io.to(event.organiser.toString()).emit("staffApplied", { eventId, staffId: req.user.id });

    res.json({ success: true, message: "Applied successfully", event });
  } catch (err) {
    next(err);
  }
};

exports.cancelApplication = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") return next({ statusCode: 403, message: "Unauthorized" });

    const { eventId } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    const before = event.applications.length;
    event.applications = event.applications.filter(a => a.staff.toString() !== req.user.id);
    if (event.applications.length === before) return next({ statusCode: 400, message: "No existing application to cancel" });
    await event.save();

    req.io.to(event.organiser.toString()).emit("staffCancelled", { eventId, staffId: req.user.id });

    res.json({ success: true, message: "Application cancelled", event });
  } catch (err) {
    next(err);
  }
};

exports.reviewApplication = async (req, res, next) => {
  try {
    const { eventId, staffId, action } = req.body; 

    if (!["organiser", "admin"].includes(req.user.role)) return next({ statusCode: 403, message: "Unauthorized" });

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only review your own event" });
    }

    const application = event.applications.find(a => a.staff.toString() === staffId);
    if (!application) return next({ statusCode: 404, message: "Application not found" });

    application.status = action === "accept" ? "accepted" : "rejected";
    await event.save();

    
    req.io.to(staffId).emit("notification", { type: "applicationReviewed", eventId, action });

    res.json({ success: true, message: `Application ${action}ed successfully`, event });
  } catch (err) {
    next(err);
  }
};

exports.getStaffEvents = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") return next({ statusCode: 403, message: "Unauthorized" });

    const allEvents = await Event.find();

    const events = allEvents.filter(event => {
      const distance = getDistanceFromLatLonInKm(
        req.user.location.lat,
        req.user.location.lng,
        event.location.lat,
        event.location.lng
      );
      const applied = event.applications.some(a => a.staff.toString() === req.user.id);
      return distance <= 10 || applied;
    });

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
};

exports.getOrganiserEvents = async (req, res, next) => {
  try {
    if (!["organiser", "admin"].includes(req.user.role)) return next({ statusCode: 403, message: "Unauthorized" });

    const events = await Event.find({ organiser: req.user.id })
      .populate("applications.staff", "fullName email phone role");

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    if (!["organiser", "admin"].includes(req.user.role)) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const { eventId } = req.params;
    const updates = req.body;

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only update your own event" });
    }

    Object.assign(event, updates);
    await event.save();

    res.json({ success: true, message: "Event updated successfully", event });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    if (!["organiser", "admin"].includes(req.user.role)) {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only delete your own event" });
    }

    await event.deleteOne();

    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};

