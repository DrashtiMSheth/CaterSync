const Event = require("../models/Event");
const Staff = require("../models/Staff");

// =====================
// ✅ CREATE EVENT (Organiser Only)
// =====================
exports.createEvent = async (req, res, next) => {
  try {
    const { name, description, location, date, priority = 1, required = 1 } = req.body;

    if (!name || !location?.address || !location?.lat || !location?.lng || !date) {
      return next({ statusCode: 400, message: "Required fields missing" });
    }

    if (req.user.role !== "organiser" && req.user.role !== "admin") {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const newEvent = new Event({
      name,
      description: description || "",
      location,
      date,
      priority,
      required,
      applied: 0,
      organiser: req.user.id,
      approved: true,
      staffAssigned: [],
      createdBy: req.user.id,
    });

    await newEvent.save();
    res.status(201).json({ message: "Event created successfully", event: newEvent });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ GET EVENTS (Based on Role)
// =====================
exports.getEvents = async (req, res, next) => {
  try {
    let events;

    if (req.user.role === "staff") {
      events = await Event.find({ staffAssigned: req.user.id })
        .populate("organiser", "fullName email organiserName")
        .populate("staffAssigned", "fullName email phone role");
    } else if (req.user.role === "organiser") {
      events = await Event.find({ organiser: req.user.id })
        .populate("staffAssigned", "fullName email phone role");
    } else if (req.user.role === "admin") {
      events = await Event.find()
        .populate("organiser", "fullName email organiserName")
        .populate("staffAssigned", "fullName email phone role");
    } else {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ GET CURRENT & UPCOMING EVENTS (Staff)
// =====================
exports.getStaffEvents = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const today = new Date();
    const events = await Event.find({ staffAssigned: req.user.id });

    const currentEvents = events.filter(e => new Date(e.date) <= today);
    const upcomingEvents = events.filter(e => new Date(e.date) > today);

    res.json({ success: true, currentEvents, upcomingEvents });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ ASSIGN STAFF TO EVENT (Organiser Only)
// =====================
exports.assignStaff = async (req, res, next) => {
  try {
    const { eventId, staffIds } = req.body;

    if (req.user.role !== "organiser" && req.user.role !== "admin") {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    if (!Array.isArray(staffIds)) {
      return next({ statusCode: 400, message: "staffIds must be an array" });
    }

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only assign staff to your own events" });
    }

    const validStaff = await Staff.find({ _id: { $in: staffIds } });
    if (validStaff.length !== staffIds.length) {
      return next({ statusCode: 400, message: "Some staff IDs are invalid" });
    }

    event.staffAssigned = staffIds;
    await event.save();

    res.json({ success: true, message: "Staff assigned successfully", event });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ GET ALL STAFF ASSIGNED TO EVENT
// =====================
exports.getEventStaff = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate("staffAssigned", "fullName email phone role");

    if (!event) return next({ statusCode: 404, message: "Event not found" });

    res.json({ success: true, staff: event.staffAssigned });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ UPDATE EVENT (Organiser Only)
// =====================
exports.updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== "organiser" && req.user.role !== "admin") {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only update your own events" });
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({ success: true, message: "Event updated successfully", event });
  } catch (err) {
    next(err);
  }
};

// =====================
// ✅ DELETE EVENT (Organiser Only)
// =====================
exports.deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== "organiser" && req.user.role !== "admin") {
      return next({ statusCode: 403, message: "Unauthorized" });
    }

    const event = await Event.findById(eventId);
    if (!event) return next({ statusCode: 404, message: "Event not found" });

    if (req.user.role === "organiser" && event.organiser.toString() !== req.user.id) {
      return next({ statusCode: 403, message: "You can only delete your own events" });
    }

    await event.remove();
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    next(err);
  }
};
