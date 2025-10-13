const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const organiserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    organiserName: { type: String, required: true },
    businessType: { type: String, required: true },
    officeAddress: { type: String, default: "" },
    website: { type: String, default: "" },
    logo: { type: String, default: "" }, 
    role: { type: String, default: "organiser" },
    otp: { type: String, default: null }, 
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

organiserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

organiserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Organiser", organiserSchema);
