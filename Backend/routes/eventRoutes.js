const express = require("express");
const eventController = require("../controllers/eventController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const router = express.Router();

router.post(
  "/organiser",
  auth,
  role("organiser"),
  eventController.createEvent
);

router.get(
  "/organiser",
  auth,
  role("organiser"),
  eventController.getOrganiserEvents
);

router.put(
  "/organiser/:eventId",
  auth,
  role("organiser"),
  eventController.updateEvent
);

router.delete(
  "/organiser/:eventId",
  auth,
  role("organiser"),
  eventController.deleteEvent
);

router.post(
  "/organiser/review-application",
  auth,
  role("organiser"),
  eventController.reviewApplication
);

router.get(
  "/staff",
  auth,
  role("staff"),
  eventController.getStaffEvents
);

router.post(
  "/staff/apply",
  auth,
  role("staff"),
  eventController.applyForEvent
);

router.delete(
  "/staff/apply",
  auth,
  role("staff"),
  eventController.cancelApplication
);

module.exports = router;
