const Notification = require('../models/Notification');

/**
 * Create an alert notification whenever an entity is created, updated, or deleted.
 */
async function createAlert({ entity, action, name, triggeredBy, entityId }) {
  try {
    const levelMap = {
      created: 'success',
      updated: 'info',
      deleted: 'alert',
    };

    const heading = `${entity} ${action}`;
    const body = `${entity} "${name}" was ${action} by ${triggeredBy || 'System'}.`;

    await Notification.create({
      level: levelMap[action] || 'info',
      heading,
      body,
      entity,
      action,
      entityId,
      triggeredBy: triggeredBy || 'System',
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
}

module.exports = { createAlert };
