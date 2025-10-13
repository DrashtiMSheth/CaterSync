const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const upload = require("../middlewares/upload");
const { validate, userRegisterValidator, userLoginValidator } = require("../middlewares/validationMiddleware");

router.post("/register", upload.single("profilePic"), userRegisterValidator, validate, staffController.register);
router.post("/login", userLoginValidator, validate, staffController.login);

router.get("/profile", auth, role("staff"), staffController.getProfile);
router.put("/profile", auth, role("staff"), staffController.updateProfile);
router.get("/events/nearby", auth, role("staff"), staffController.getAvailableEvents);
router.post("/events/:eventId/apply", auth, role("staff"), staffController.applyForEvent);
router.post("/events/:eventId/cancel", auth, role("staff"), staffController.cancelApplication);
router.get("/applications", auth, role("staff"), staffController.getMyApplications);

router.post("/:staffId/rate", auth, role("organiser"), staffController.rateStaff);
router.get("/", auth, role("organiser"), staffController.getStaff);

module.exports = router;
