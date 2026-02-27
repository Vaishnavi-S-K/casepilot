const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    ref: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Criminal', 'Civil', 'Family', 'Corporate', 'Immigration', 'Intellectual Property', 'Real Estate', 'Labor'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Active', 'Pending', 'On Hold', 'Closed', 'Appeal'],
      default: 'Pending',
    },
    urgency: {
      type: String,
      required: true,
      enum: ['Critical', 'High', 'Standard', 'Low'],
      default: 'Standard',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
    },
    leadAttorney: {
      type: String,
      required: true,
    },
    supportingCounsel: {
      type: String,
      default: '',
    },
    court: {
      type: String,
      default: '',
    },
    hearingDate: {
      type: Date,
    },
    filedOn: {
      type: Date,
    },
    portfolioValue: {
      type: Number,
      default: 0,
    },
    overview: {
      type: String,
      default: '',
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Auto-generate ref before saving
caseSchema.pre('save', async function (next) {
  if (!this.ref) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Case').countDocuments();
    this.ref = `CP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
