import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Calendar, DollarSign, User, Building2, Scale } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import AlertDialog from '../components/ui/AlertDialog';
import { ShimmerCard } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import MiniProgress from '../components/ui/MiniProgress';
import { casesAPI, documentsAPI, tasksAPI, notificationsAPI } from '../api/client';
import { formatDate, formatCurrency, statusColor, urgencyColor, timeAgo, initials, avatarColor } from '../utils/formatters';
import toast from 'react-hot-toast';

const STATUS_BADGE = { Active: 'emerald', Pending: 'amber', 'On Hold': 'sky', Closed: 'gray', Appeal: 'violet' };
const URGENCY_BADGE = { Critical: 'red', High: 'rose', Standard: 'amber', Low: 'green' };

export default function CaseProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [docs, setDocs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [caseRes, docsRes, tasksRes, notifsRes] = await Promise.all([
          casesAPI.getOne(id),
          documentsAPI.getAll({ caseId: id, limit: 50 }),
          tasksAPI.getAll({ caseId: id, limit: 50 }),
          notificationsAPI.getAll({ limit: 50 }),
        ]);
        setCaseData(caseRes.data);
        setDocs(docsRes.data || []);
        setTasks(tasksRes.data || []);
        setTimeline((notifsRes.data || []).filter(n => n.entityId === id));
      } catch {
        toast.error('Failed to load case');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await casesAPI.remove(id);
      toast.success('Case deleted');
      navigate('/cases');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
        </div>
      </PageShell>
    );
  }

  if (!caseData) {
    return (
      <PageShell>
        <BlankSlate title="Case not found" description="The case you're looking for doesn't exist" actionLabel="Back to Cases" onAction={() => navigate('/cases')} />
      </PageShell>
    );
  }

  const c = caseData;
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: `Documents (${docs.length})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'timeline', label: 'Timeline' },
  ];

  return (
    <PageShell>
      {/* Top bar */}
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <Link to="/cases" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} /> Back to Cases
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/cases')} className="btn-outline text-sm flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </button>
            <button onClick={() => setDeleteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-rose-600 border border-rose-300 rounded-input hover:bg-rose-50 transition-colors">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </AnimatedItem>

      {/* Hero */}
      <AnimatedItem>
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className="font-mono text-lg text-indigo-600 font-bold">{c.ref}</span>
              <h1 className="text-xl font-heading font-extrabold text-gray-900 mt-1">{c.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={c.status} color={STATUS_BADGE[c.status] || 'gray'} size="md" />
              <Badge label={c.urgency} color={URGENCY_BADGE[c.urgency] || 'gray'} size="md" pulse={c.urgency === 'Critical'} />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-3 py-1.5 rounded-badge text-gray-600">
              <User size={12} /> {c.clientId?.fullName || 'No client'}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-3 py-1.5 rounded-badge text-gray-600">
              <Scale size={12} /> {c.leadAttorney}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-3 py-1.5 rounded-badge text-gray-600">
              <Building2 size={12} /> {c.court || 'No court assigned'}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-3 py-1.5 rounded-badge text-gray-600">
              <Calendar size={12} /> {formatDate(c.hearingDate)}
            </span>
            <span className="flex items-center gap-1.5 text-xs bg-gray-100 px-3 py-1.5 rounded-badge text-gray-600">
              <DollarSign size={12} /> {formatCurrency(c.portfolioValue)}
            </span>
          </div>
        </div>
      </AnimatedItem>

      {/* Case Status Pipeline */}
      <AnimatedItem>
        <div className="card p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Case Progress</h3>
          <div className="flex items-center gap-0">
            {['Pending', 'Active', 'On Hold', 'Appeal', 'Closed'].map((stage, idx, arr) => {
              const stageIdx = arr.indexOf(c.status);
              const isActive = idx === stageIdx;
              const isPast = idx < stageIdx;
              const colors = {
                Pending: { bg: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700', light: 'bg-amber-50' },
                Active: { bg: 'bg-indigo-500', ring: 'ring-indigo-200', text: 'text-indigo-700', light: 'bg-indigo-50' },
                'On Hold': { bg: 'bg-sky-500', ring: 'ring-sky-200', text: 'text-sky-700', light: 'bg-sky-50' },
                Appeal: { bg: 'bg-violet-500', ring: 'ring-violet-200', text: 'text-violet-700', light: 'bg-violet-50' },
                Closed: { bg: 'bg-gray-500', ring: 'ring-gray-200', text: 'text-gray-700', light: 'bg-gray-100' },
              };
              const col = colors[stage];
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive ? `${col.bg} text-white ring-4 ${col.ring} scale-110` :
                      isPast ? `${col.bg} text-white opacity-60` : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span className={`text-[10px] font-semibold mt-1.5 ${isActive ? col.text : isPast ? 'text-gray-500' : 'text-gray-400'}`}>
                      {stage}
                    </span>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className={`h-0.5 flex-1 -mx-1 ${isPast ? col.bg + ' opacity-40' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedItem>

      {/* Tab navigation */}
      <AnimatedItem>
        <div className="flex gap-1 mb-6 border-b border-cp-border">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </AnimatedItem>

      {/* Tab Content */}
      <AnimatedItem>
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5 space-y-3">
              <h3 className="font-heading font-bold text-gray-900 mb-3">Case Details</h3>
              {[
                ['Category', c.category],
                ['Status', c.status],
                ['Urgency', c.urgency],
                ['Lead Attorney', c.leadAttorney],
                ['Supporting Counsel', c.supportingCounsel || '—'],
                ['Court', c.court || '—'],
                ['Filed On', formatDate(c.filedOn)],
                ['Hearing Date', formatDate(c.hearingDate)],
                ['Portfolio Value', formatCurrency(c.portfolioValue)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <h3 className="font-heading font-bold text-gray-900 mb-3">Overview</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{c.overview || 'No overview provided.'}</p>
              {c.labels?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Labels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.labels.map(l => (
                      <span key={l} className="bg-indigo-50 text-indigo-600 text-[11px] font-semibold px-2 py-0.5 rounded-badge">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'documents' && (
          docs.length === 0 ? (
            <BlankSlate title="No documents attached" description="Documents linked to this case will appear here" />
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Type</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Due By</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Rev</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d._id} className="border-t border-gray-50 hover:bg-cp-base">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-2.5"><Badge label={d.docType} color="indigo" /></td>
                      <td className="px-4 py-2.5"><Badge label={d.reviewStatus} color={d.reviewStatus === 'Filed' ? 'emerald' : d.reviewStatus === 'Approved' ? 'teal' : d.reviewStatus === 'Rejected' ? 'rose' : 'amber'} /></td>
                      <td className={`px-4 py-2.5 text-xs ${d.dueBy && new Date(d.dueBy) < new Date() ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{formatDate(d.dueBy)}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">v{d.revision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'tasks' && (
          tasks.length === 0 ? (
            <BlankSlate title="No tasks for this case" description="Tasks linked to this case will appear here" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(t => (
                <div key={t._id} className="card card-hover p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{t.title}</h4>
                    <Badge label={t.stage} color={t.stage === 'Done' ? 'emerald' : t.stage === 'In Progress' ? 'indigo' : 'gray'} />
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{t.owner}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Deadline: {formatDate(t.deadline)}</span>
                  </div>
                  <MiniProgress value={t.progress} />
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'timeline' && (
          timeline.length === 0 ? (
            <BlankSlate title="No timeline events" description="Activity for this case will appear here" />
          ) : (
            <div className="relative pl-8 space-y-6">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />
              {timeline.map((n, i) => (
                <div key={n._id || i} className="relative">
                  <div className={`absolute left-[-22px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                    n.action === 'created' ? 'bg-emerald-500' : n.action === 'deleted' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`} />
                  <div className="card p-3">
                    <p className="text-sm font-medium text-gray-900">{n.heading}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </AnimatedItem>

      <AlertDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Case"
        message={`Are you sure you want to delete "${c.title}"? All related data will remain but the case reference will be removed.`}
      />
    </PageShell>
  );
}
