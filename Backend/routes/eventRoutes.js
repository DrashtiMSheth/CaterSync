// routes/eventRoutes.js
const express = require("express");
const organiserController = require("../controllers/organiserController");
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles"); // optional role-based access

const router = express.Router();

// =====================
// ORGANISER EVENT ROUTES
// =====================

// Create new event (organiser only)
router.post(
  "/organiser",
  auth,
  role("organiser"),
  organiserController.createEvent
);

// Get all events created by organiser
router.get(
  "/organiser",
  auth,
  role("organiser"),
  organiserController.getEvents
);

// Update event (organiser only)
router.put(
  "/organiser/:eventId",
  auth,
  role("organiser"),
  organiserController.updateEvent
);

// Delete event (organiser only)
router.delete(
  "/organiser/:eventId",
  auth,
  role("organiser"),
  organiserController.deleteEvent
);

// Assign staff to event (organiser only)
router.post(
  "/organiser/assign-staff",
  auth,
  role("organiser"),
  organiserController.assignStaff
);

// =====================
// STAFF EVENT ROUTES
// =====================

// Get events assigned to staff
router.get(
  "/staff",
  auth,
  role("staff"),
  staffController.getStaffEvents
);

module.exports = router;
