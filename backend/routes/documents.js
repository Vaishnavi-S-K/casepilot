const router = require('express').Router();
const Document = require('../models/Document');
const { createAlert } = require('../utils/notifyHelper');

// GET /api/documents
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      reviewStatus,
      docType,
      caseId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo,
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { preparedBy: { $regex: search, $options: 'i' } },
      ];
    }
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (docType) filter.docType = docType;
    if (caseId) filter.caseId = caseId;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Document.find(filter).populate('caseId', 'ref title').sort(sort).skip(skip).limit(parseInt(limit)),
      Document.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Document.findById(req.params.id).populate('caseId', 'ref title');
    if (!item) return res.status(404).json({ success: false, error: 'Document not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/documents
router.post('/', async (req, res, next) => {
  try {
    const item = await Document.create(req.body);
    await createAlert({
      entity: 'Document',
      action: 'created',
      name: item.name,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/documents/:id
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Document not found' });
    await createAlert({
      entity: 'Document',
      action: 'updated',
      name: item.name,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Document.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Document not found' });
    await createAlert({
      entity: 'Document',
      action: 'deleted',
      name: item.name,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
