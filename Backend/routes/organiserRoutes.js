const express = require("express");
const router = express.Router();
const organiserController = require("../controllers/organiserController");
const auth = require("../middlewares/auth");
const role = require("../middlewares/roles");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { validationResult } = require("express-validator");
const {
  organiserRegisterValidator,
  organiserLoginValidator,
  createEventValidator,
} = require("../middlewares/validationMiddleware");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  next();
};

router.post(
  "/register",
  upload.single("companyLogo"),
  organiserRegisterValidator,
  validate,
  organiserController.register
);

router.post("/login", organiserLoginValidator, validate, organiserController.login);

router.get("/events", auth, role("organiser"), organiserController.getEvents);

router.post(
  "/events",
  auth,
  role("organiser"),
  upload.array("attachments", 5), 
  createEventValidator,
  validate,
  organiserController.createEvent
);

router.get("/profile", auth, role("organiser"), organiserController.getProfile);

router.put("/profile", auth, role("organiser"), upload.single("companyLogo"), organiserController.updateProfile);

router.get("/profile", verifyOrganiserToken, getProfile);

module.exports = router;
