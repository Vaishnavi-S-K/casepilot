const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    details: {
      type: String,
      default: '',
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },
    owner: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      default: '',
    },
    urgency: {
      type: String,
      required: true,
      enum: ['Critical', 'High', 'Standard', 'Low'],
      default: 'Standard',
    },
    stage: {
      type: String,
      required: true,
      enum: ['Backlog', 'Todo', 'In Progress', 'Review', 'Done', 'Dropped'],
      default: 'Todo',
    },
    deadline: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    plannedHours: {
      type: Number,
      default: 0,
    },
    loggedHours: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    checklist: {
      type: [
        {
          item: { type: String },
          done: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
