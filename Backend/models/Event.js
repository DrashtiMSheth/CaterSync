const mongoose = require("mongoose");

// Allowed special requirements per role
const allowedSpecialRequirements = {
  "Waiter": ["Gluten-Free", "Vegan", "Allergy Awareness", "Customer Experience", "Quick Service", "Smart POS Handling", "Professional Appearance"],
  "Chef": ["Gluten-Free", "Vegan", "Allergy Awareness", "Culinary Innovation", "Food Safety Certification", "Menu Customization", "Efficient Workflow"],
  "Driver": ["Vehicle Type", "GPS Knowledge", "Experienced", "Night Shift", "Safety & Compliance", "On-Time Performance", "Event Traffic Awareness"],
  "Cleaner": ["Eco-Friendly Products", "Experienced", "Night Shift", "Quick Cleaning", "Hygiene & Safety Standards", "Sanitization Expertise", "Attention to Detail"],
  "Supervisor": ["Experience", "Multi-Role", "Leadership", "Night Shift", "Certification", "Team Coordination", "Real-Time Decision Making"],
  "Decorator": ["Floral", "Lighting", "Theme-Based", "Creative", "Experienced", "Modern Aesthetic Sense", "Event Branding Awareness"],
  "Photographer": ["Wedding", "Corporate", "Birthday", "Drone", "Experienced", "Event Storytelling", "Social Media Ready Shots", "Adaptable to Event Types"],
  "Videographer": ["Wedding", "Corporate", "Drone", "Editing Skills", "Experienced", "Cinematic Videography", "Content Optimization for Social Media", "Adaptability"],
  "DJ": ["Genre Speciality", "Equipment Own", "Night Shift", "Experienced", "Crowd Control", "Live Mixing Skills", "Event Mood Setting"],
  "Anchor": ["Bilingual", "Stage Experience", "Emcee", "Corporate", "Wedding", "Audience Engagement", "Event Flow Management", "Public Speaking"]
};

// Schema for individual staff roles
const staffRoleSchema = new mongoose.Schema({
  male: { type: Number, default: 0 },
  female: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },      // ₹ per person or per-event for DJ/Anchor
  comments: { type: String, default: "" },
  specialReq: {
    type: [String],
    default: [],
    validate: {
      validator: function(values) {
        if (!values || values.length === 0) return true;
        const allowed = allowedSpecialRequirements[this._roleName] || [];
        return values.every(v => allowed.includes(v));
      },
      message: "Invalid special requirement(s) for role."
    }
  }
}, { _id: false });

// Roles
const roles = [
  "Waiter", "Chef", "Driver", "Cleaner", "Supervisor",
  "Decorator", "Photographer", "Videographer", "DJ", "Anchor"
];

// Validator to ensure DJ/Anchor only have 1 male OR 1 female
function singleSelectionValidator() {
  const dj = this.staff.DJ || {};
  const anchor = this.staff.Anchor || {};

  if ((dj.male || 0) + (dj.female || 0) > 1) return false;
  if ((anchor.male || 0) + (anchor.female || 0) > 1) return false;

  return true;
}

// Event schema
const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },

  location: {
    address: { type: String, default: "" },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },

  priority: { type: Number, default: 1 },
  hours: { type: Number, default: 1 }, // total event hours
  totalStaffCount: { type: Number, default: 0 },
  totalBudget: { type: Number, default: 0 },
  paymentMode: { type: String, default: "" },

  staff: roles.reduce((acc, role) => {
    acc[role] = { type: staffRoleSchema, default: {} };
    return acc;
  }, {}),

  approved: { type: Boolean, default: false },

  ratings: [
    {
      staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, default: "" },
    }
  ],

}, { 
  timestamps: true,
  validate: { validator: singleSelectionValidator, message: "DJ/Anchor can only have 1 male OR 1 female selected at a time." }
});

// Pre-validation hook: attach role name to staffRole for specialReq validation
eventSchema.pre('validate', function(next) {
  for (const role of roles) {
    if (this.staff[role]) {
      this.staff[role]._roleName = role;
    }
  }
  next();
});

// Method: calculate total staff count
eventSchema.methods.calculateTotalStaff = function() {
  let total = 0;
  for (const roleData of Object.values(this.staff)) {
    if (!roleData) continue;
    total += (roleData.male || 0) + (roleData.female || 0);
  }
  return total;
};

// Method: calculate total budget
eventSchema.methods.calculateTotalBudget = function(hours = 1) {
  let total = 0;
  for (const [roleName, roleData] of Object.entries(this.staff)) {
    if (!roleData) continue;
    if (roleName === "DJ" || roleName === "Anchor") {
      total += roleData.budget || 0; // per-event
    } else {
      const count = (roleData.male || 0) + (roleData.female || 0);
      total += (roleData.budget || 0) * count * hours;
    }
  }
  return total;
};

// Pre-save hook: auto-update totals
eventSchema.pre('save', function(next) {
  this.totalStaffCount = this.calculateTotalStaff();
  this.totalBudget = this.calculateTotalBudget(this.hours);
  next();
});

module.exports = mongoose.model("Event", eventSchema);
