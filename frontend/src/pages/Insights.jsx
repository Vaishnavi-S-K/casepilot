import { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import { ShimmerChart, ShimmerCard } from '../components/ui/Shimmer';
import { statsAPI } from '../api/client';
import {
  Filter, Download, TrendingUp, Clock, Target, CheckCircle,
  Users, FileText, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

/* ─── Color palettes ─── */
const PALETTE = ['#4F46E5','#0D9488','#7C3AED','#F59E0B','#EF4444','#EC4899','#06B6D4','#84CC16'];
const DOC_COLORS = { Draft:'#9CA3AF', Submitted:'#38BDF8', 'Under Review':'#F59E0B', Approved:'#0D9488', Filed:'#10B981', Rejected:'#EF4444' };
const FUNNEL_COLORS = ['#F59E0B','#4F46E5','#9CA3AF','#7C3AED','#10B981'];

const RANGE_OPTIONS = [
  { value: '1m', label: 'Last Month' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '12m', label: 'Last 12 Months' },
  { value: 'all', label: 'All Time' },
];

/* ─── Heatmap color from value ─── */
function heatColor(v, max) {
  if (v === 0 || max === 0) return '#F9FAFB';
  const intensity = Math.min(v / max, 1);
  const r = Math.round(255 - intensity * (255 - 79));
  const g = Math.round(255 - intensity * (255 - 70));
  const b = Math.round(255 - intensity * (255 - 229));
  return `rgb(${r},${g},${b})`;
}

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [range, setRange] = useState('12m');
  const [attorney, setAttorney] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await statsAPI.insights({ range, attorney, category });
      setData(res.data || res);
    } catch {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [range, attorney, category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Export handler — generates Excel workbook */
  const handleExport = () => {
    if (!data) return toast.error('No data to export');
    const wb = XLSX.utils.book_new();

    /* Sheet 1 — Performance Metrics */
    const perfRows = [
      ['Metric', 'Value'],
      ['Resolution Rate (%)', perf.resolutionRate || 0],
      ['Closed Cases', perf.closedCount || 0],
      ['Total Cases in Range', perf.totalInRange || 0],
      ['Avg Days to Close', perf.avgDaysToClose || 0],
      ['Task On-Time Rate (%)', perf.taskOnTimeRate || 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perfRows), 'Performance');

    /* Sheet 2 — Attorney Workload */
    if (atty.attorneyWorkload?.length) {
      const ws2 = XLSX.utils.json_to_sheet(atty.attorneyWorkload);
      XLSX.utils.book_append_sheet(wb, ws2, 'Attorney Workload');
    }

    /* Sheet 3 — Attorney Billable Hours */
    if (atty.billableByAttorney?.length) {
      const ws3 = XLSX.utils.json_to_sheet(atty.billableByAttorney);
      XLSX.utils.book_append_sheet(wb, ws3, 'Billable Hours');
    }

    /* Sheet 4 — Task Completion by Attorney */
    if (atty.taskCompletionByAttorney?.length) {
      const ws4 = XLSX.utils.json_to_sheet(atty.taskCompletionByAttorney);
      XLSX.utils.book_append_sheet(wb, ws4, 'Task Completion');
    }

    /* Sheet 5 — Avg Case Value by Attorney */
    if (atty.avgCaseValue?.length) {
      const ws5 = XLSX.utils.json_to_sheet(atty.avgCaseValue);
      XLSX.utils.book_append_sheet(wb, ws5, 'Avg Case Value');
    }

    /* Sheet 6 — Case Pipeline Funnel */
    if (pipeline.funnel?.length) {
      const ws6 = XLSX.utils.json_to_sheet(pipeline.funnel);
      XLSX.utils.book_append_sheet(wb, ws6, 'Pipeline Funnel');
    }

    /* Sheet 7 — Category × Status Heatmap */
    if (heatmap.length) {
      const hmHeader = ['Category', ...statuses];
      const hmRows = [hmHeader, ...heatmap.map(r => [r.category, ...statuses.map(s => r[s] || 0)])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hmRows), 'Heatmap');
    }

    /* Sheet 8 — Document Health */
    if (docs.docsByStatus?.length) {
      const ws8 = XLSX.utils.json_to_sheet(docs.docsByStatus);
      XLSX.utils.book_append_sheet(wb, ws8, 'Document Status');
    }

    const rangeName = RANGE_OPTIONS.find(r => r.value === range)?.label || range;
    const filename = `Advocourt_Insights_${rangeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('Report exported to Excel');
  };

  /* ─── Custom tooltip ─── */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-dropdown text-xs border border-cp-border">
        <p className="font-semibold text-gray-700 mb-1">{label || payload[0].name}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }}>{p.name || p.dataKey}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
        ))}
      </div>
    );
  };

  /* ─── Loading state ─── */
  if (loading && !data) return (
    <PageShell>
      <AnimatedItem><h1 className="text-2xl font-heading font-extrabold text-gray-900 mb-2">Insights & Analytics</h1></AnimatedItem>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{[...Array(4)].map((_, i) => <ShimmerCard key={i} />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(6)].map((_, i) => <ShimmerChart key={i} />)}</div>
    </PageShell>
  );

  const d = data || {};
  const perf = d.performance || {};
  const atty = d.attorneys || {};
  const pipeline = d.pipeline || {};
  const docs = d.documents || {};
  const filterOpts = d.filters || {};

  const heatmap = pipeline.heatmap || [];
  const statuses = pipeline.statuses || [];
  let heatMax = 0;
  heatmap.forEach(row => statuses.forEach(st => { if (row[st] > heatMax) heatMax = row[st]; }));

  return (
    <PageShell>
      {/* ═══ HEADER ═══ */}
      <AnimatedItem>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Insights & Analytics</h1>
            <p className="text-xs text-gray-500 mt-1">
              Analyze firm performance across custom date ranges and attorneys. Use filters to drill down into specific time periods or team members.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-input hover:bg-indigo-700 transition-colors shrink-0 print:hidden"
          >
            <Download size={14} /> Export Report
          </button>
        </div>
      </AnimatedItem>

      {/* ═══ FILTER BAR ═══ */}
      <AnimatedItem>
        <div className="card p-3 mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Filter size={13} /> Filters
          </div>
          <select value={range} onChange={e => setRange(e.target.value)} className="select-field w-auto min-w-[140px]">
            {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={attorney} onChange={e => setAttorney(e.target.value)} className="select-field w-auto min-w-[150px]">
            <option value="">All Attorneys</option>
            {(filterOpts.attorneys || []).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)} className="select-field w-auto min-w-[150px]">
            <option value="">All Categories</option>
            {(filterOpts.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(attorney || category || range !== '12m') && (
            <button
              onClick={() => { setRange('12m'); setAttorney(''); setCategory(''); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Reset
            </button>
          )}
          {loading && <span className="text-[10px] text-indigo-500 animate-pulse ml-auto">Updating…</span>}
        </div>
      </AnimatedItem>

      {/* ═══ SECTION 1 — Performance Metrics ═══ */}
      <AnimatedItem>
        <h2 className="text-sm font-heading font-bold text-indigo-600 uppercase tracking-wider mb-3">Performance Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Resolution Rate */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-50"><Target size={18} className="text-emerald-600" /></div>
            </div>
            <p className="text-2xl font-heading font-extrabold text-gray-900">{perf.resolutionRate || 0}%</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Resolution Rate</p>
            <p className="text-xs text-gray-400">{perf.closedCount || 0} of {perf.totalInRange || 0} cases closed</p>
          </div>

          {/* Avg Days to Close */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-50"><Clock size={18} className="text-indigo-600" /></div>
            </div>
            <p className="text-2xl font-heading font-extrabold text-gray-900">{perf.avgDaysToClose || 0}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Avg Days to Close</p>
            <p className="text-xs text-gray-400">From filing to closure</p>
          </div>

          {/* Task On-Time Rate */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-teal-50"><CheckCircle size={18} className="text-teal-600" /></div>
            </div>
            <p className="text-2xl font-heading font-extrabold text-gray-900">{perf.taskOnTimeRate || 0}%</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Task On-Time Rate</p>
            <p className="text-xs text-gray-400">Completed before deadline</p>
          </div>

          {/* Cases in Range */}
          <div className="card p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-50"><TrendingUp size={18} className="text-amber-600" /></div>
            </div>
            <p className="text-2xl font-heading font-extrabold text-gray-900">{perf.totalInRange || 0}</p>
            <p className="text-sm font-medium text-gray-500 mt-0.5">Cases in Period</p>
            <p className="text-xs text-gray-400">Filed in selected range</p>
          </div>
        </div>
      </AnimatedItem>

      {/* ═══ SECTION 2 — Attorney Performance ═══ */}
      <AnimatedItem>
        <h2 className="text-sm font-heading font-bold text-violet-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Users size={14} /> Attorney Performance
        </h2>
      </AnimatedItem>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Attorney Workload */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Caseload by Attorney</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atty.attorneyWorkload || []} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cases" name="Cases" radius={[0, 6, 6, 0]}>
                  {(atty.attorneyWorkload || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>

        {/* Billable Hours */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Billable Hours by Attorney</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atty.billableByAttorney || []} margin={{ top: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="logged" name="Logged" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="planned" name="Planned" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>

        {/* Task Completion Rate per Attorney */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Task Completion by Attorney</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atty.taskCompletionByAttorney || []} margin={{ top: 5, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10B981" />
                <Bar dataKey="late" name="Late" stackId="a" fill="#EF4444" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>

        {/* Avg Case Value per Attorney */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Avg Case Value by Attorney</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={atty.avgCaseValue || []} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avgValue" name="Avg Value ($)" radius={[0, 6, 6, 0]}>
                  {(atty.avgCaseValue || []).map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>
      </div>

      {/* ═══ SECTION 3 — Case Pipeline ═══ */}
      <AnimatedItem>
        <h2 className="text-sm font-heading font-bold text-teal-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity size={14} /> Case Pipeline
        </h2>
      </AnimatedItem>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Case Funnel */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Case Status Funnel</h3>
            <ResponsiveContainer width="100%" height={250}>
              <FunnelChart>
                <Tooltip content={<CustomTooltip />} />
                <Funnel dataKey="value" data={pipeline.funnel || []} isAnimationActive>
                  <LabelList position="right" fill="#374151" stroke="none" dataKey="name" fontSize={11} />
                  <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={13} fontWeight={700} />
                  {(pipeline.funnel || []).map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>

        {/* Category vs Status Heatmap */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Category × Status Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-2 font-semibold text-gray-600 min-w-[100px]">Category</th>
                    {statuses.map(st => (
                      <th key={st} className="text-center py-2 px-2 font-semibold text-gray-600 min-w-[60px]">{st}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row, ri) => (
                    <tr key={ri}>
                      <td className="py-1.5 px-2 font-medium text-gray-700">{row.category}</td>
                      {statuses.map(st => (
                        <td key={st} className="py-1.5 px-2 text-center">
                          <span
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[11px] font-bold"
                            style={{
                              backgroundColor: heatColor(row[st], heatMax),
                              color: row[st] > heatMax * 0.5 ? '#fff' : '#374151',
                            }}
                          >
                            {row[st]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
              <span>Less</span>
              <div className="flex gap-0.5">
                {[0, 0.25, 0.5, 0.75, 1].map((lvl, i) => (
                  <div key={i} className="w-4 h-3 rounded-sm" style={{ backgroundColor: heatColor(lvl * heatMax, heatMax) }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </AnimatedItem>
      </div>

      {/* ═══ SECTION 4 — Document Health ═══ */}
      <AnimatedItem>
        <h2 className="text-sm font-heading font-bold text-rose-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileText size={14} /> Document Health
        </h2>
      </AnimatedItem>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-8">
        {/* Docs by Review Status — Pie */}
        <AnimatedItem>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Review Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={docs.docsByStatus || []} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(docs.docsByStatus || []).map((entry, i) => (
                    <Cell key={i} fill={DOC_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnimatedItem>
      </div>

      {/* ═══ FOOTER — Print info ═══ */}
      <div className="hidden print:block text-center text-xs text-gray-400 mt-8 border-t pt-4">
        Advocourt Insights Report · Generated {new Date().toLocaleDateString()} · Range: {RANGE_OPTIONS.find(r => r.value === range)?.label}
        {attorney && ` · Attorney: ${attorney}`}{category && ` · Category: ${category}`}
      </div>
    </PageShell>
  );
}
