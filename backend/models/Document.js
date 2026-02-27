const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Document name is required'],
      trim: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    docType: {
      type: String,
      required: true,
      enum: ['Contract', 'Affidavit', 'Motion', 'Legal Brief', 'Evidence', 'Subpoena', 'Court Order', 'Settlement', 'NDA'],
    },
    reviewStatus: {
      type: String,
      required: true,
      enum: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Filed', 'Rejected'],
      default: 'Draft',
    },
    preparedBy: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    revision: {
      type: Number,
      default: 1,
    },
    remarks: {
      type: String,
      default: '',
    },
    dueBy: {
      type: Date,
    },
    labels: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
