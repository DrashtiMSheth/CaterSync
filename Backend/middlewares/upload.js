const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"), 
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only JPEG, PNG, JPG, and PDF are allowed."));
  }
  cb(null, true);
};

const limits = {
  fileSize: 200 * 1024 * 1024, 
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
