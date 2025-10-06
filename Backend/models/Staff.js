const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "staff" },
  skills: { type: [String], default: [] },
  experience: { type: String, default: "" },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  availability: { type: String, required: true },
  gender: { type: String, default: "" },
  languages: { type: String, default: "" },
  profilePic: { type: String, default: "" },
  terms: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  payment: { type: Number, default: 0 },
  method: { type: String, default: "" },
  comments: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
