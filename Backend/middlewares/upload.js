// middlewares/upload.js
const multer = require("multer");
const path = require("path");

// Storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), // folder to save uploads
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)), // timestamped filename
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  cb(null, allowedTypes.includes(file.mimetype));
};

module.exports = multer({ storage, fileFilter });
