const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },

  location: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },

  priority: { type: Number, default: 1 },
  requiredStaff: { type: Number, default: 1 },

  organiser: { type: mongoose.Schema.Types.ObjectId, ref: "Organiser", required: true },

  applications: [
    {
      staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      appliedAt: { type: Date, default: Date.now },
    }
  ],

  attachments: [
    {
      filename: { type: String },
      url: { type: String }, 
      uploadedAt: { type: Date, default: Date.now },
    }
  ],

  approved: { type: Boolean, default: false },

  ratings: [
    {
      staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, default: "" },
    }
  ],

}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);
