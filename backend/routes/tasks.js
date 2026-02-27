const router = require('express').Router();
const Task = require('../models/Task');
const { createAlert } = require('../utils/notifyHelper');

// GET /api/tasks
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      stage,
      urgency,
      owner,
      caseId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
      ];
    }
    if (stage) filter.stage = stage;
    if (urgency) filter.urgency = urgency;
    if (owner) filter.owner = { $regex: owner, $options: 'i' };
    if (caseId) filter.caseId = caseId;
    if (dateFrom || dateTo) {
      filter.deadline = {};
      if (dateFrom) filter.deadline.$gte = new Date(dateFrom);
      if (dateTo) filter.deadline.$lte = new Date(dateTo);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Task.find(filter).populate('caseId', 'ref title').sort(sort).skip(skip).limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Task.findById(req.params.id).populate('caseId', 'ref title');
    if (!item) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const item = await Task.create(req.body);
    await createAlert({
      entity: 'Task',
      action: 'created',
      name: item.title,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

    // Ownership check — only the task owner or creator can edit
    const currentUser = (req.headers['x-user-name'] || '').trim().toLowerCase();
    const taskOwner = (existing.owner || '').trim().toLowerCase();
    const taskCreator = (existing.createdBy || '').trim().toLowerCase();
    if (currentUser && taskOwner && currentUser !== taskOwner && currentUser !== taskCreator) {
      return res.status(403).json({ success: false, error: 'You can only edit your own tasks' });
    }

    const item = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await createAlert({
      entity: 'Task',
      action: 'updated',
      name: item.title,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Task not found' });

    // Ownership check — only the task owner or creator can delete
    const currentUser = (req.headers['x-user-name'] || '').trim().toLowerCase();
    const taskOwner = (existing.owner || '').trim().toLowerCase();
    const taskCreator = (existing.createdBy || '').trim().toLowerCase();
    if (currentUser && taskOwner && currentUser !== taskOwner && currentUser !== taskCreator) {
      return res.status(403).json({ success: false, error: 'You can only delete your own tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    await createAlert({
      entity: 'Task',
      action: 'deleted',
      name: existing.title,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: existing._id,
    });
    res.json({ success: true, data: existing });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
