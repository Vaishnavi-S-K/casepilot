const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      default: '',
    },
    organisation: {
      type: String,
      default: '',
    },
    clientType: {
      type: String,
      required: true,
      enum: ['Individual', 'Corporation', 'Government', 'Non-Profit'],
      default: 'Individual',
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    tier: {
      type: String,
      required: true,
      enum: ['Standard', 'Premium', 'VIP'],
      default: 'Standard',
    },
    standing: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    openCases: {
      type: Number,
      default: 0,
    },
    closedCases: {
      type: Number,
      default: 0,
    },
    billedTotal: {
      type: Number,
      default: 0,
    },
    internalNotes: {
      type: String,
      default: '',
    },
    onboardedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Client', clientSchema);
