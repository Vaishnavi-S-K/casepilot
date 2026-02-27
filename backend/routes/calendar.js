const router = require('express').Router();
const Case = require('../models/Case');
const Task = require('../models/Task');
const Document = require('../models/Document');

// GET /api/calendar?year=2026&month=2
router.get('/', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const dateRange = { $gte: startDate, $lte: endDate };

    const [hearings, filings, taskDeadlines, docDueDates] = await Promise.all([
      Case.find({ hearingDate: dateRange }).select('ref title hearingDate status urgency'),
      Case.find({ filedOn: dateRange }).select('ref title filedOn status'),
      Task.find({ deadline: dateRange }).select('title deadline stage urgency').populate('caseId', 'ref'),
      Document.find({ dueBy: dateRange }).select('name dueBy reviewStatus').populate('caseId', 'ref'),
    ]);

    const events = [];

    hearings.forEach((c) => {
      events.push({
        date: c.hearingDate,
        kind: 'hearing',
        label: `${c.ref} — ${c.title}`,
        id: c._id,
        status: c.status,
        urgency: c.urgency,
      });
    });

    filings.forEach((c) => {
      events.push({
        date: c.filedOn,
        kind: 'filing',
        label: `${c.ref} — ${c.title}`,
        id: c._id,
        status: c.status,
      });
    });

    taskDeadlines.forEach((t) => {
      events.push({
        date: t.deadline,
        kind: 'task',
        label: t.title,
        id: t._id,
        status: t.stage,
        urgency: t.urgency,
        caseRef: t.caseId?.ref || '',
      });
    });

    docDueDates.forEach((d) => {
      events.push({
        date: d.dueBy,
        kind: 'document',
        label: d.name,
        id: d._id,
        status: d.reviewStatus,
        caseRef: d.caseId?.ref || '',
      });
    });

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
