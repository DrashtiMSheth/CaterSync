// models/Staff.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const staffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, default: "staff" },
    skills: { type: [String], default: [] },
    experience: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number },
    },
    availability: { type: String, default: "" }, // e.g., "full-time", "part-time"
    gender: { type: String, default: "" },
    languages: { type: [String], default: [] },
    profilePic: { type: String, default: "" },
    ratings: [
      {
        organiser: { type: mongoose.Schema.Types.ObjectId, ref: "Organiser" },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
  },
  { timestamps: true }
);

// =====================
// ✅ Pre-save password hashing
// =====================
staffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// =====================
// ✅ Compare password method
// =====================
staffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Staff", staffSchema);
