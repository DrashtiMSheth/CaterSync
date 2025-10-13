const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, default: "user" },
    profilePic: { type: String, default: "" }, 
    notifications: [
      {
        type: { type: String },
        message: { type: String },
        relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    appliedEvents: [
      {
        event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        appliedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
