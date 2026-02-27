const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ['info', 'success', 'warning', 'alert'],
      default: 'info',
    },
    heading: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      default: '',
    },
    entity: {
      type: String,
      enum: ['Case', 'Document', 'Task', 'Client'],
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'deleted'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    triggeredBy: {
      type: String,
      default: 'System',
    },
    seenBy: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Auto-expire old notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
