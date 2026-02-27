import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, Users, ListChecks, FileCheck, TrendingUp, RefreshCw, Scale, CalendarClock, FileText, Gavel } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import KPICard from '../components/ui/KPICard';
import Badge from '../components/ui/Badge';
import { ShimmerCard, ShimmerTable, ShimmerChart } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import MiniProgress from '../components/ui/MiniProgress';
import CasesBarChart from '../components/charts/CasesBarChart';
import StatusPieChart from '../components/charts/StatusPieChart';
import FilingTrendChart from '../components/charts/FilingTrendChart';
import { statsAPI, seedAPI } from '../api/client';
import { getSession } from '../utils/authStore';
import { formatDate, formatCurrency, statusColor, urgencyColor } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await statsAPI.get();
      setStats(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleSeed = async () => {
    try {
      await seedAPI.run();
      toast.success('Demo data seeded!');
      fetchStats();
    } catch {
      toast.error('Seed failed');
    }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = session?.name?.split(' ')[0] || 'there';
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <PageShell>
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <ShimmerCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShimmerChart />
          <ShimmerChart />
        </div>
      </PageShell>
    );
  }

  const c = stats?.counts || {};
  const ch = stats?.charts || {};
  const lists = stats?.lists || {};
  const myWork = stats?.myWork || {};

  const attentionItems = (c.overdueTasks || 0) + (c.overdueDocs || 0);

  return (
    <PageShell>
      {/* ROW 0 — Greeting */}
      <AnimatedItem>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {dayName}, {dateStr} · {attentionItems > 0 ? `${attentionItems} items need your attention today` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSeed} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 border border-teal-300 rounded-input hover:bg-teal-50 transition-colors">
              Seed Demo Data
            </button>
            <button onClick={fetchStats} className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </AnimatedItem>

      {/* MY WORK — Personalized Overview */}
      <AnimatedItem>
        <div className="mb-6">
          <h2 className="text-sm font-heading font-bold text-indigo-600 uppercase tracking-wider mb-3">My Work</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KPICard title="My Cases" value={myWork.myCases || 0} icon={Scale} topColor="indigo" subtitle={`${myWork.myActiveCases || 0} active`} />
            <KPICard title="My Tasks" value={myWork.myOpenTasks || 0} icon={ListChecks} topColor="teal" subtitle={`of ${myWork.myTasks || 0} total`} />
            <KPICard title="My Docs" value={myWork.myDocs || 0} icon={FileText} topColor="violet" subtitle="Prepared by you" />
          </div>
        </div>
      </AnimatedItem>

      {/* ROW 1 — KPI Cards */}
      <AnimatedItem>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <KPICard title="Active Cases" value={c.activeCases || 0} icon={Briefcase} topColor="indigo" trend={12} subtitle="Total cases tracked" />
          <KPICard title="Total Clients" value={c.totalClients || 0} icon={Users} topColor="teal" trend={8} subtitle={`${c.premiumClients || 0} premium/VIP`} />
          <KPICard title="Open Tasks" value={(c.totalTasks || 0) - (c.doneTasks || 0)} icon={ListChecks} topColor="warning" trend={-(c.overdueTasks || 0)} subtitle={`${c.overdueTasks || 0} overdue`} />
          <KPICard title="Docs Filed" value={c.filedDocs || 0} icon={FileCheck} topColor="success" trend={15} subtitle={`${c.totalDocs || 0} total documents`} />
          <KPICard title="Portfolio Value" value={formatCurrency(stats?.aggregated?.totalPortfolioValue || 0)} icon={TrendingUp} topColor="violet" subtitle="Total case value" />
        </div>
      </AnimatedItem>

      {/* ROW 2 — Charts */}
      <AnimatedItem>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3 card p-5">
            <h3 className="font-heading font-bold text-gray-900 mb-4">Cases by Category</h3>
            {ch.casesByCategory?.length ? (
              <CasesBarChart data={ch.casesByCategory} />
            ) : (
              <BlankSlate title="No case data" description="Seed the database to see chart data" />
            )}
          </div>
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-heading font-bold text-gray-900 mb-4">Status Overview</h3>
            {ch.casesByStatus?.length ? (
              <StatusPieChart data={ch.casesByStatus} />
            ) : (
              <BlankSlate title="No status data" />
            )}
          </div>
        </div>
      </AnimatedItem>

      {/* ROW 3 — Trend + Tasks */}
      <AnimatedItem>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="card p-5">
            <h3 className="font-heading font-bold text-gray-900 mb-4">Cases Filed — Last 6 Months</h3>
            {ch.casesByMonth?.length ? (
              <FilingTrendChart data={ch.casesByMonth} />
            ) : (
              <BlankSlate title="No filing trend data" />
            )}
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-gray-900">Task Progress Overview</h3>
              <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View All →
              </Link>
            </div>
            {lists.recentCases?.length ? (
              <div className="space-y-4">
                {(lists.recentCases || []).slice(0, 5).map((c) => (
                  <div key={c._id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                      <p className="text-xs text-teal-600">{c.clientId?.fullName || 'No client'}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-badge ${statusColor(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <BlankSlate title="No tasks to display" />
            )}
          </div>
        </div>
      </AnimatedItem>

      {/* ROW 3.5 — This Week's Deadlines */}
      <AnimatedItem>
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-cp-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={16} className="text-indigo-500" />
              <h3 className="font-heading font-bold text-gray-900">This Week's Deadlines</h3>
            </div>
            <span className="text-xs font-semibold text-gray-400">{myWork.weekDeadlines?.length || 0} items</span>
          </div>
          {myWork.weekDeadlines?.length ? (
            <div className="divide-y divide-gray-50">
              {myWork.weekDeadlines.map((item, idx) => {
                const daysLeft = Math.ceil((new Date(item.date) - new Date()) / 86400000);
                const typeIcons = { hearing: Gavel, task: ListChecks, document: FileText };
                const typeColors = { hearing: 'text-rose-500 bg-rose-50', task: 'text-indigo-500 bg-indigo-50', document: 'text-teal-500 bg-teal-50' };
                const TypeIcon = typeIcons[item.type] || CalendarClock;
                const colorClass = typeColors[item.type] || 'text-gray-500 bg-gray-50';
                return (
                  <div key={idx} className={`px-5 py-3 flex items-center gap-3 ${daysLeft <= 1 ? 'bg-rose-50/50' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                      <TypeIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className="text-xs text-gray-400 capitalize">{item.type}{item.meta ? ` · ${item.meta}` : ''}{item.ref ? ` · ${item.ref}` : ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-gray-700">{formatDate(item.date)}</p>
                      <p className={`text-[10px] font-bold ${daysLeft <= 1 ? 'text-rose-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {daysLeft <= 0 ? 'TODAY' : daysLeft === 1 ? 'TOMORROW' : `${daysLeft} days left`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <BlankSlate title="No deadlines this week" description="You're all clear for the next 7 days 🎉" />
          )}
        </div>
      </AnimatedItem>

      {/* ROW 4 — Tables */}
      <AnimatedItem>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Cases */}
          <div className="lg:col-span-3 card overflow-hidden">
            <div className="px-5 py-3 border-b border-cp-border">
              <h3 className="font-heading font-bold text-gray-900">Recent Cases</h3>
            </div>
            {lists.recentCases?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Ref#</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Title</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Category</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Attorney</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Status</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lists.recentCases.map((c) => (
                      <tr key={c._id} className="border-t border-gray-50 hover:bg-cp-base transition-colors">
                        <td className="px-4 py-2.5">
                          <Link to={`/cases/${c._id}`} className="font-mono text-xs text-indigo-600 hover:underline">
                            {c.ref}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium max-w-[200px] truncate">{c.title}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{c.category}</td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{c.leadAttorney}</td>
                        <td className="px-4 py-2.5">
                          <Badge label={c.status} color={statusColor(c.status).includes('emerald') ? 'emerald' : statusColor(c.status).includes('amber') ? 'amber' : statusColor(c.status).includes('sky') ? 'sky' : statusColor(c.status).includes('violet') ? 'violet' : 'gray'} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge label={c.urgency} color={c.urgency === 'Critical' ? 'red' : c.urgency === 'High' ? 'rose' : c.urgency === 'Standard' ? 'amber' : 'green'} pulse={c.urgency === 'Critical'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <BlankSlate title="No cases yet" description="Seed the database to populate cases" actionLabel="Seed Data" onAction={handleSeed} />
            )}
          </div>

          {/* Upcoming Hearings */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-5 py-3 border-b border-cp-border">
              <h3 className="font-heading font-bold text-gray-900">Upcoming Hearings</h3>
            </div>
            {lists.upcomingHearings?.length ? (
              <div className="divide-y divide-gray-50">
                {lists.upcomingHearings.map((c) => {
                  const daysLeft = Math.ceil((new Date(c.hearingDate) - new Date()) / 86400000);
                  let stripClass = '';
                  if (daysLeft <= 5) stripClass = 'border-l-4 border-l-rose-500 bg-rose-50';
                  else if (daysLeft <= 14) stripClass = 'border-l-4 border-l-amber-400 bg-amber-50';
                  return (
                    <div key={c._id} className={`px-4 py-3 ${stripClass}`}>
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <Link to={`/cases/${c._id}`} className="font-mono text-xs text-indigo-600 hover:underline">{c.ref}</Link>
                          <p className="text-sm text-gray-900 font-medium truncate mt-0.5">{c.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.leadAttorney}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-xs font-semibold text-gray-700">{formatDate(c.hearingDate)}</p>
                          {daysLeft <= 5 && <span className="text-[10px] font-bold text-rose-600">URGENT</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <BlankSlate title="No upcoming hearings" description="Hearings within 30 days will appear here" />
            )}
          </div>
        </div>
      </AnimatedItem>
    </PageShell>
  );
}
