const router = require('express').Router();
const Client = require('../models/Client');
const { createAlert } = require('../utils/notifyHelper');

// GET /api/clients
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      clientType,
      tier,
      standing,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { organisation: { $regex: search, $options: 'i' } },
      ];
    }
    if (clientType) filter.clientType = clientType;
    if (tier) filter.tier = tier;
    if (standing) filter.standing = standing;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({ success: true, data, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    next(err);
  }
});

// GET /api/clients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await Client.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// POST /api/clients
router.post('/', async (req, res, next) => {
  try {
    const item = await Client.create(req.body);
    await createAlert({
      entity: 'Client',
      action: 'created',
      name: item.fullName,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const item = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Client not found' });
    await createAlert({
      entity: 'Client',
      action: 'updated',
      name: item.fullName,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const item = await Client.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Client not found' });
    await createAlert({
      entity: 'Client',
      action: 'deleted',
      name: item.fullName,
      triggeredBy: req.headers['x-user-name'] || 'System',
      entityId: item._id,
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
