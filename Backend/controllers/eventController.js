const Event = require("../models/Event");
const Users = require("../models/User");

// ✅ Create Event (Organizer only)
exports.createEvent = async (req, res) => {
  try {
    const { name, description, location, date } = req.body;

    if (!name || !location || !date) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // Only Organizer or Admin can create events
    if (req.user.role !== "organizer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const event = new Event({
      name,
      description,
      location,
      date,
      createdBy: req.user.id,
      staffAssigned: [], // Initially empty
    });

    await event.save();
    res.status(201).json({ message: "Event created successfully", event });
  } catch (err) {
    console.error("Event create error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Events for Logged-in User
exports.getEvents = async (req, res) => {
  try {
    let events;

    if (req.user.role === "staff") {
      // Staff sees events assigned to them
      events = await Event.find({ staffAssigned: req.user.id });
    } else if (req.user.role === "organizer") {
      // Organizer sees events they created
      events = await Event.find({ createdBy: req.user.id });
    } else if (req.user.role === "admin") {
      // Admin sees all events
      events = await Event.find();
    }

    res.json({ success: true, events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Current & Upcoming Events (Staff)
exports.getStaffEvents = async (req, res) => {
  try {
    if (req.user.role !== "staff") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const today = new Date();
    const events = await Event.find({ staffAssigned: req.user.id });

    const currentEvents = events.filter(e => new Date(e.date) <= today);
    const upcomingEvents = events.filter(e => new Date(e.date) > today);

    res.json({ success: true, currentEvents, upcomingEvents });
  } catch (err) {
    console.error("Get staff events error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Assign Staff to Event (Organizer Only)
exports.assignStaff = async (req, res) => {
  try {
    if (req.user.role !== "organizer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { eventId, staffIds } = req.body; // staffIds = array of staff user IDs
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.staffAssigned = staffIds;
    await event.save();

    res.json({ success: true, message: "Staff assigned successfully", event });
  } catch (err) {
    console.error("Assign staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get All Staff Assigned to an Event (Organizer/Admin)
exports.getEventStaff = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate("staffAssigned", "fullName email phone role");

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({ success: true, staff: event.staffAssigned });
  } catch (err) {
    console.error("Get event staff error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Event (Organizer Only)
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== "organizer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only the creator can update (unless admin)
    if (req.user.role === "organizer" && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own events" });
    }

    Object.assign(event, req.body); // Update event fields
    await event.save();

    res.json({ success: true, message: "Event updated successfully", event });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Delete Event (Organizer Only)
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (req.user.role !== "organizer" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Only creator can delete (unless admin)
    if (req.user.role === "organizer" && event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own events" });
    }

    await event.remove();
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
