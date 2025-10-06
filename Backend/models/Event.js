const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  date: { type: Date, required: true },
  priority: { type: Number, default: 1 },
  required: { type: Number, default: 1 },
  applied: { type: Number, default: 0 },
  organiser: { type: mongoose.Schema.Types.ObjectId, ref: "Organiser", required: true },
  approved: { type: Boolean, default: true },
  staffAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: "Staff" }],
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
