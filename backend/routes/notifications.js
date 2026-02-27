const router = require('express').Router();
const Notification = require('../models/Notification');

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, level, entity } = req.query;
    const filter = {};
    if (level) filter.level = level;
    if (entity) filter.entity = entity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments(filter),
    ]);

    // Count unread for the current user
    const userEmail = req.headers['x-user-email'] || '';
    const unread = userEmail
      ? await Notification.countDocuments({ seenBy: { $ne: userEmail } })
      : 0;

    res.json({ success: true, data, total, unread, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    await Notification.updateMany(
      { seenBy: { $ne: userEmail } },
      { $addToSet: { seenBy: userEmail } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const userEmail = req.headers['x-user-email'] || 'unknown';
    await Notification.findByIdAndUpdate(req.params.id, { $addToSet: { seenBy: userEmail } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notifications — clear all
router.delete('/', async (req, res, next) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
