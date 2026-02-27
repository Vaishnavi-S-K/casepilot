const router = require('express').Router();
const Case = require('../models/Case');
const Client = require('../models/Client');
const Document = require('../models/Document');
const Task = require('../models/Task');

// GET /api/search?q=
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: { cases: [], clients: [], documents: [], tasks: [] } });
    }

    const regex = { $regex: q, $options: 'i' };

    const [cases, clients, documents, tasks] = await Promise.all([
      Case.find({ $or: [{ ref: regex }, { title: regex }] })
        .select('ref title status category')
        .limit(6),
      Client.find({ $or: [{ fullName: regex }, { email: regex }, { organisation: regex }] })
        .select('fullName email organisation tier')
        .limit(6),
      Document.find({ name: regex })
        .select('name docType reviewStatus')
        .limit(6),
      Task.find({ $or: [{ title: regex }, { owner: regex }] })
        .select('title owner stage urgency')
        .limit(6),
    ]);

    res.json({ success: true, data: { cases, clients, documents, tasks } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
