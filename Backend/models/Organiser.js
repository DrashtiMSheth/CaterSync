const mongoose = require("mongoose");

const organiserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  organiserName: { type: String, required: true },
  businessType: { type: String, required: true },
  officeAddress: { type: String, default: "" },
  website: { type: String, default: "" },
  logo: { type: String, default: "" },
  role: { type: String, default: "organiser" },
  otp: { type: String, default: null } // optional
}, { timestamps: true });

module.exports = mongoose.model("Organiser", organiserSchema);
