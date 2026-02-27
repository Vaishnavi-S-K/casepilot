const router = require('express').Router();
const Case = require('../models/Case');
const { createAlert } = require('../utils/notifyHelper');

// GET /api/cases — paginated list with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      urgency,
      category,
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
        { ref: { $regex: search, $options: 'i' } },
        { leadAttorney: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (category) filter.category = category;
    if (caseId) filter._id = caseId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Case.find(filter).populate('clientId', 'fullName email organisation').sort(sort).skip(skip).limit(parseInt(limit)),
      Case.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Case.findById(req.params.id).populate('clientId', 'fullName email organisation');
    if (!item) return res.status(404).json({ success: false, error: 'Case not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases
router.post('/', async (req, res, next) => {
  try {
    const item = await Case.create(req.body);
    await createAlert({
      entity: 'Case',
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

// PUT /api/cases/:id
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Case.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Case not found' });
    await createAlert({
      entity: 'Case',
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

// DELETE /api/cases/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Case.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Case not found' });
    await createAlert({
      entity: 'Case',
      action: 'deleted',
      name: item.title,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
