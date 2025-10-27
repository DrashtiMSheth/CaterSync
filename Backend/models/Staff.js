const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const staffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    skills: { type: [String], default: [] },
    experience: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number },
    },
    availability: { type: String, default: "" },
    gender: { type: String, default: "" },
    languages: { type: [String], default: [] },
    profilePic: { type: String, default: "" }, 
    ratings: [
      {
        organiser: { type: mongoose.Schema.Types.ObjectId, ref: "Organiser" },
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        rating: { type: Number, min: 1, max: 5 },
      },
    ],
    appliedEvents: [
      {
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
    notifications: [
      {
        type: { type: String },
        message: { type: String },
        relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

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

staffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Staff", staffSchema);
