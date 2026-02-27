const router = require('express').Router();
const Case = require('../models/Case');
const Client = require('../models/Client');
const Document = require('../models/Document');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// GET /api/stats
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();

    // --- Counts ---
    const [
      totalCases, activeCases, closedCases, pendingCases,
      totalClients, premiumClients,
      totalDocs, filedDocs,
      totalTasks, doneTasks,
    ] = await Promise.all([
      Case.countDocuments(),
      Case.countDocuments({ status: 'Active' }),
      Case.countDocuments({ status: 'Closed' }),
      Case.countDocuments({ status: 'Pending' }),
      Client.countDocuments(),
      Client.countDocuments({ tier: { $in: ['Premium', 'VIP'] } }),
      Document.countDocuments(),
      Document.countDocuments({ reviewStatus: 'Filed' }),
      Task.countDocuments(),
      Task.countDocuments({ stage: 'Done' }),
    ]);

    const overdueDocs = await Document.countDocuments({ dueBy: { $lt: now }, reviewStatus: { $nin: ['Filed', 'Approved'] } });
    const overdueTasks = await Task.countDocuments({ deadline: { $lt: now }, stage: { $nin: ['Done', 'Dropped'] } });

    // --- Aggregated ---
    const avgProgressResult = await Task.aggregate([{ $group: { _id: null, avg: { $avg: '$progress' } } }]);
    const avgProgress = avgProgressResult.length ? Math.round(avgProgressResult[0].avg) : 0;

    const portfolioResult = await Case.aggregate([{ $group: { _id: null, total: { $sum: '$portfolioValue' } } }]);
    const totalPortfolioValue = portfolioResult.length ? portfolioResult[0].total : 0;

    // --- Charts ---
    const casesByCategory = await Case.aggregate([
      { $group: { _id: '$category', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    const casesByStatus = await Case.aggregate([
      { $group: { _id: '$status', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
    ]);

    // Cases by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const casesByMonth = await Case.aggregate([
      { $match: { filedOn: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$filedOn' } },
          count: { $sum: 1 },
        },
      },
      { $project: { month: '$_id', count: 1, _id: 0 } },
      { $sort: { month: 1 } },
    ]);

    const tasksByStage = await Task.aggregate([
      { $group: { _id: '$stage', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
    ]);

    const docsByStatus = await Document.aggregate([
      { $group: { _id: '$reviewStatus', value: { $sum: 1 } } },
      { $project: { name: '$_id', value: 1, _id: 0 } },
    ]);

    // --- Lists ---
    const recentCases = await Case.find()
      .populate('clientId', 'fullName')
      .sort({ createdAt: -1 })
      .limit(5);

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const upcomingHearings = await Case.find({
      hearingDate: { $gte: now, $lte: thirtyDaysLater },
    })
      .populate('clientId', 'fullName')
      .sort({ hearingDate: 1 })
      .limit(10);

    const latestAlerts = await Notification.find().sort({ createdAt: -1 }).limit(5);

    // --- Attorney Workload (cases per attorney) ---
    const attorneyWorkload = await Case.aggregate([
      { $group: { _id: '$leadAttorney', cases: { $sum: 1 }, value: { $sum: '$portfolioValue' } } },
      { $project: { name: '$_id', cases: 1, value: 1, _id: 0 } },
      { $sort: { cases: -1 } },
    ]);

    // --- Billable Hours per Attorney ---
    const billableByAttorney = await Task.aggregate([
      { $group: { _id: '$owner', planned: { $sum: '$plannedHours' }, logged: { $sum: '$loggedHours' } } },
      { $project: { name: '$_id', planned: 1, logged: 1, _id: 0 } },
      { $sort: { logged: -1 } },
    ]);

    // --- Personalized "My Work" stats (based on x-user-name header) ---
    // Fallback to first seeded attorney if header is empty/missing
    const rawUser = req.headers['x-user-name'] || '';
    let userName = rawUser;
    if (!userName) {
      const firstCase = await Case.findOne().select('leadAttorney').lean();
      userName = firstCase?.leadAttorney || '';
    }
    const [myCases, myActiveCases, myTasks, myOpenTasks, myDocs] = await Promise.all([
      Case.countDocuments({ leadAttorney: userName }),
      Case.countDocuments({ leadAttorney: userName, status: 'Active' }),
      Task.countDocuments({ owner: userName }),
      Task.countDocuments({ owner: userName, stage: { $nin: ['Done', 'Dropped'] } }),
      Document.countDocuments({ preparedBy: userName }),
    ]);

    const myBillableResult = await Task.aggregate([
      { $match: { owner: userName } },
      { $group: { _id: null, planned: { $sum: '$plannedHours' }, logged: { $sum: '$loggedHours' } } },
    ]);
    const myBillable = myBillableResult.length
      ? { planned: myBillableResult[0].planned, logged: myBillableResult[0].logged }
      : { planned: 0, logged: 0 };

    const myHearings = await Case.find({
      leadAttorney: userName,
      hearingDate: { $gte: now, $lte: thirtyDaysLater },
    }).sort({ hearingDate: 1 }).limit(5).populate('clientId', 'fullName');

    // --- This Week's Deadlines (for the logged-in user) ---
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [weekHearings, weekTasks, weekDocs] = await Promise.all([
      Case.find({
        leadAttorney: userName,
        hearingDate: { $gte: now, $lte: weekEnd },
      }).select('ref title hearingDate court').lean(),
      Task.find({
        owner: userName,
        deadline: { $gte: now, $lte: weekEnd },
        stage: { $nin: ['Done', 'Dropped'] },
      }).select('title deadline urgency stage').lean(),
      Document.find({
        preparedBy: userName,
        dueBy: { $gte: now, $lte: weekEnd },
        reviewStatus: { $nin: ['Filed', 'Approved'] },
      }).select('name dueBy docType reviewStatus').lean(),
    ]);

    // Merge into a unified timeline
    const weekDeadlines = [
      ...weekHearings.map(h => ({ type: 'hearing', label: h.title, ref: h.ref, date: h.hearingDate, meta: h.court })),
      ...weekTasks.map(t => ({ type: 'task', label: t.title, date: t.deadline, meta: t.urgency, stage: t.stage })),
      ...weekDocs.map(d => ({ type: 'document', label: d.name, date: d.dueBy, meta: d.docType, status: d.reviewStatus })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        counts: {
          totalCases, activeCases, closedCases, pendingCases,
          totalClients, premiumClients,
          totalDocs, filedDocs, overdueDocs,
          totalTasks, doneTasks, overdueTasks,
        },
        aggregated: { avgProgress, totalPortfolioValue },
        charts: { casesByCategory, casesByStatus, casesByMonth, tasksByStage, docsByStatus, attorneyWorkload, billableByAttorney },
        lists: { recentCases, upcomingHearings, latestAlerts },
        myWork: {
          myCases, myActiveCases, myTasks, myOpenTasks, myDocs,
          myBillable, myHearings, weekDeadlines,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ────────────────────────────────────────────
// GET /api/stats/insights — Deep-dive analytics with filters
// ────────────────────────────────────────────
router.get('/insights', async (req, res, next) => {
  try {
    const now = new Date();
    const { range = '12m', attorney = '', category = '' } = req.query;

    // --- Build date filter from range ---
    let dateFrom = new Date();
    switch (range) {
      case '1m': dateFrom.setMonth(dateFrom.getMonth() - 1); break;
      case '3m': dateFrom.setMonth(dateFrom.getMonth() - 3); break;
      case '6m': dateFrom.setMonth(dateFrom.getMonth() - 6); break;
      case '12m': dateFrom.setFullYear(dateFrom.getFullYear() - 1); break;
      case 'all': dateFrom = new Date(0); break;
      default: dateFrom.setFullYear(dateFrom.getFullYear() - 1);
    }

    // Base match filters — use business-relevant dates only
    const caseMatch = { filedOn: { $gte: dateFrom } };
    if (attorney) caseMatch.leadAttorney = attorney;
    if (category) caseMatch.category = category;

    const taskMatch = { deadline: { $gte: dateFrom } };
    if (attorney) taskMatch.owner = attorney;

    const docMatch = { dueBy: { $gte: dateFrom } };
    if (attorney) docMatch.preparedBy = attorney;

    // ═══ SECTION 1 — Performance Metrics ═══

    // Total & closed cases in range
    const casesInRange = await Case.find(caseMatch).lean();
    const totalInRange = casesInRange.length;
    const closedInRange = casesInRange.filter(c => c.status === 'Closed');
    const closedCount = closedInRange.length;

    // Case Resolution Rate (% closed within range)
    const resolutionRate = totalInRange > 0 ? Math.round((closedCount / totalInRange) * 100) : 0;

    // Average Days to Close
    const daysToClosed = closedInRange
      .filter(c => c.filedOn && c.updatedAt)
      .map(c => Math.round((new Date(c.updatedAt) - new Date(c.filedOn)) / 86400000));
    const avgDaysToClose = daysToClosed.length > 0 ? Math.round(daysToClosed.reduce((a, b) => a + b, 0) / daysToClosed.length) : 0;

    // Task On-Time Rate
    const tasksInRange = await Task.find(taskMatch).lean();
    const completedTasks = tasksInRange.filter(t => t.stage === 'Done');
    const onTimeTasks = completedTasks.filter(t => {
      if (!t.deadline || !t.resolvedAt) return true; // no deadline = on time
      return new Date(t.resolvedAt) <= new Date(t.deadline);
    });
    const taskOnTimeRate = completedTasks.length > 0
      ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;

    // Case Outcomes (won / settled / dismissed / other)
    const outcomeMap = {};
    closedInRange.forEach(c => {
      const labels = (c.labels || []).map(l => l.toLowerCase());
      let outcome = 'Other';
      if (labels.includes('won')) outcome = 'Won';
      else if (labels.includes('settled')) outcome = 'Settled';
      else if (labels.includes('dismissed')) outcome = 'Dismissed';
      else if (labels.includes('lost')) outcome = 'Lost';
      outcomeMap[outcome] = (outcomeMap[outcome] || 0) + 1;
    });
    const caseOutcomes = Object.entries(outcomeMap).map(([name, value]) => ({ name, value }));
    if (caseOutcomes.length === 0 && closedCount > 0) {
      caseOutcomes.push({ name: 'Resolved', value: closedCount });
    }

    // ═══ SECTION 2 — Attorney Performance ═══

    // Attorney Workload (cases per attorney) — filtered
    const attorneyWorkload = await Case.aggregate([
      { $match: caseMatch },
      { $group: { _id: '$leadAttorney', cases: { $sum: 1 }, value: { $sum: '$portfolioValue' } } },
      { $project: { name: '$_id', cases: 1, value: 1, _id: 0 } },
      { $sort: { cases: -1 } },
    ]);

    // Billable Hours by Attorney — filtered
    const billableByAttorney = await Task.aggregate([
      { $match: taskMatch },
      { $group: { _id: '$owner', planned: { $sum: '$plannedHours' }, logged: { $sum: '$loggedHours' } } },
      { $project: { name: '$_id', planned: 1, logged: 1, _id: 0 } },
      { $sort: { logged: -1 } },
    ]);

    // Task Completion Rate per Attorney
    const tasksByAttorney = {};
    tasksInRange.forEach(t => {
      if (!t.owner) return;
      if (!tasksByAttorney[t.owner]) tasksByAttorney[t.owner] = { total: 0, done: 0, onTime: 0, late: 0 };
      tasksByAttorney[t.owner].total++;
      if (t.stage === 'Done') {
        tasksByAttorney[t.owner].done++;
        if (t.deadline && t.resolvedAt && new Date(t.resolvedAt) > new Date(t.deadline)) {
          tasksByAttorney[t.owner].late++;
        } else {
          tasksByAttorney[t.owner].onTime++;
        }
      }
    });
    const taskCompletionByAttorney = Object.entries(tasksByAttorney).map(([name, v]) => ({
      name,
      onTime: v.onTime,
      late: v.late,
      pending: v.total - v.done,
      rate: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0,
    })).sort((a, b) => b.rate - a.rate);

    // Avg Case Value per Attorney
    const avgCaseValue = attorneyWorkload.map(a => ({
      name: a.name,
      avgValue: a.cases > 0 ? Math.round(a.value / a.cases) : 0,
    }));

    // ═══ SECTION 3 — Case Pipeline ═══

    // Case Funnel
    const statusOrder = ['Pending', 'Active', 'On Hold', 'Appeal', 'Closed'];
    const funnelData = [];
    for (const s of statusOrder) {
      const cnt = casesInRange.filter(c => c.status === s).length;
      funnelData.push({ name: s, value: cnt });
    }

    // Category vs Status Heatmap
    const allCategories = [...new Set(casesInRange.map(c => c.category))].sort();
    const allStatuses = statusOrder;
    const heatmapData = allCategories.map(cat => {
      const row = { category: cat };
      allStatuses.forEach(st => {
        row[st] = casesInRange.filter(c => c.category === cat && c.status === st).length;
      });
      return row;
    });

    // ═══ SECTION 4 — Document Health ═══

    const docsInRange = await Document.find(docMatch).lean();

    // Documents by review status (filtered)
    const docStatusMap = {};
    docsInRange.forEach(d => {
      docStatusMap[d.reviewStatus] = (docStatusMap[d.reviewStatus] || 0) + 1;
    });
    const docsByStatus = Object.entries(docStatusMap).map(([name, value]) => ({ name, value }));

    // ═══ Available filter options ═══
    const allAttorneys = await Case.distinct('leadAttorney');
    const allCategoryOptions = await Case.distinct('category');

    res.json({
      success: true,
      data: {
        filters: { attorneys: allAttorneys.sort(), categories: allCategoryOptions.sort() },
        performance: { resolutionRate, avgDaysToClose, taskOnTimeRate, totalInRange, closedCount, caseOutcomes },
        attorneys: { attorneyWorkload, billableByAttorney, taskCompletionByAttorney, avgCaseValue },
        pipeline: { funnel: funnelData, heatmap: heatmapData, statuses: allStatuses, categories: allCategories },
        documents: { docsByStatus },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
