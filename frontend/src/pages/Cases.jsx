import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, AlertTriangle, Printer } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import FilterBar from '../components/ui/FilterBar';
import Badge from '../components/ui/Badge';
import Paginator from '../components/ui/Paginator';
import Dialog from '../components/ui/Dialog';
import AlertDialog from '../components/ui/AlertDialog';
import { ShimmerTable } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import { casesAPI, clientsAPI } from '../api/client';
import { getUsers } from '../utils/authStore';
import { formatDate, formatCurrency, statusColor, urgencyColor } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const CATEGORIES = ['Criminal', 'Civil', 'Family', 'Corporate', 'Immigration', 'Intellectual Property', 'Real Estate', 'Labor'];
const STATUSES = ['Active', 'Pending', 'On Hold', 'Closed', 'Appeal'];
const URGENCIES = ['Critical', 'High', 'Standard', 'Low'];

const STATUS_BADGE = { Active: 'emerald', Pending: 'amber', 'On Hold': 'sky', Closed: 'gray', Appeal: 'violet' };
const URGENCY_BADGE = { Critical: 'red', High: 'rose', Standard: 'amber', Low: 'green' };

const emptyForm = {
  title: '', category: '', status: 'Pending', urgency: 'Standard', clientId: '',
  leadAttorney: '', supportingCounsel: '', court: '', hearingDate: '', filedOn: '',
  portfolioValue: '', overview: '', labels: '',
};

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', urgency: '', category: '' });
  const debouncedSearch = useDebounce(filters.search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [clients, setClients] = useState([]);
  const teamMembers = getUsers();

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.category) params.category = filters.category;
      const res = await casesAPI.getAll(params);
      setCases(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch {
      toast.error('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters.status, filters.urgency, filters.category]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  useEffect(() => {
    clientsAPI.getAll({ limit: 100 }).then(r => setClients(r.data || [])).catch(() => {});
  }, []);

  const handleFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', urgency: '', category: '' });
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      title: c.title || '',
      category: c.category || '',
      status: c.status || 'Pending',
      urgency: c.urgency || 'Standard',
      clientId: c.clientId?._id || c.clientId || '',
      leadAttorney: c.leadAttorney || '',
      supportingCounsel: c.supportingCounsel || '',
      court: c.court || '',
      hearingDate: c.hearingDate ? c.hearingDate.slice(0, 10) : '',
      filedOn: c.filedOn ? c.filedOn.slice(0, 10) : '',
      portfolioValue: c.portfolioValue || '',
      overview: c.overview || '',
      labels: (c.labels || []).join(', '),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.status) errs.status = 'Status is required';
    if (!form.urgency) errs.urgency = 'Urgency is required';
    if (!form.leadAttorney) errs.leadAttorney = 'Lead Attorney is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        portfolioValue: form.portfolioValue ? Number(form.portfolioValue) : 0,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await casesAPI.update(editing._id, payload);
        toast.success('Case updated');
      } else {
        await casesAPI.create(payload);
        toast.success('Case created');
      }
      setModalOpen(false);
      fetchCases();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await casesAPI.remove(deleteTarget._id);
      toast.success('Case deleted');
      setDeleteTarget(null);
      fetchCases();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const filterConfig = [
    { key: 'category', label: 'Category', options: CATEGORIES },
    { key: 'status', label: 'Status', options: STATUSES },
    { key: 'urgency', label: 'Urgency', options: URGENCIES },
  ];

  return (
    <PageShell>
      {/* Header */}
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Cases</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-badge">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2 text-sm">
              <Printer size={16} /> Export
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> New Case
            </button>
          </div>
        </div>
      </AnimatedItem>

      {/* Filter Bar */}
      <AnimatedItem>
        <FilterBar filters={filterConfig} values={filters} onChange={handleFilter} onClear={clearFilters} />
      </AnimatedItem>

      {/* Table */}
      <AnimatedItem>
        {loading ? (
          <ShimmerTable rows={6} />
        ) : cases.length === 0 ? (
          <BlankSlate title="No cases found" description="Try adjusting filters or create a new case" actionLabel="New Case" onAction={openCreate} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Ref#</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Case Title</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Category</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Client</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Lead Attorney</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Status</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Urgency</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Hearing</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Value</th>
                    <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c, i) => {
                    const hearingPast = c.hearingDate && new Date(c.hearingDate) < new Date();
                    const hearingSoon = c.hearingDate && !hearingPast && (new Date(c.hearingDate) - new Date()) / 86400000 <= 7;
                    return (
                      <tr key={c._id} className={`border-t border-gray-50 hover:bg-cp-base transition-colors group ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-2.5">
                          <Link to={`/cases/${c._id}`} className="font-mono text-xs text-indigo-600 hover:underline">{c.ref}</Link>
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 font-medium max-w-[200px] truncate">{c.title}</td>
                        <td className="px-4 py-2.5">
                          <Badge label={c.category} color="indigo" />
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{c.clientId?.fullName || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{c.leadAttorney}</td>
                        <td className="px-4 py-2.5">
                          <Badge label={c.status} color={STATUS_BADGE[c.status] || 'gray'} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge label={c.urgency} color={URGENCY_BADGE[c.urgency] || 'gray'} pulse={c.urgency === 'Critical'} />
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className={hearingPast ? 'line-through text-gray-400' : hearingSoon ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                            {formatDate(c.hearingDate)}
                          </span>
                          {hearingSoon && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{formatCurrency(c.portfolioValue)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/cases/${c._id}`} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Eye size={14} /></Link>
                            <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget(c)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-cp-border">
              <Paginator page={page} pages={pages} total={total} limit={10} onPageChange={setPage} />
            </div>
          </div>
        )}
      </AnimatedItem>

      {/* Create/Edit Modal */}
      <Dialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Case' : 'New Case'}
        size="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Update Case' : 'Create Case'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {editing && (
              <div>
                <label className="label-field">Ref#</label>
                <input className="input-field font-mono bg-gray-50" value={editing.ref} readOnly />
              </div>
            )}
            <div>
              <label className="label-field">Title *</label>
              <input className={`input-field ${formErrors.title ? 'border-rose-400' : ''}`} value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label className="label-field">Category *</label>
              <select className={`select-field ${formErrors.category ? 'border-rose-400' : ''}`} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formErrors.category && <p className="text-xs text-rose-500 mt-1">{formErrors.category}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Status *</label>
                <select className="select-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label-field">Urgency *</label>
                <select className="select-field" value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}>
                  {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label-field">Client</label>
              <select className="select-field" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})}>
                <option value="">Select client</option>
                {clients.map(c => <option key={c._id} value={c._id}>{c.fullName}</option>)}
              </select>
            </div>
          </div>
          {/* Right column */}
          <div className="space-y-4">
            <div>
              <label className="label-field">Lead Attorney *</label>
              <select className={`select-field ${formErrors.leadAttorney ? 'border-rose-400' : ''}`} value={form.leadAttorney} onChange={e => setForm({...form, leadAttorney: e.target.value})}>
                <option value="">Select attorney</option>
                {teamMembers.map(m => <option key={m.email} value={m.name}>{m.name}</option>)}
              </select>
              {formErrors.leadAttorney && <p className="text-xs text-rose-500 mt-1">{formErrors.leadAttorney}</p>}
            </div>
            <div>
              <label className="label-field">Supporting Counsel</label>
              <input className="input-field" value={form.supportingCounsel} onChange={e => setForm({...form, supportingCounsel: e.target.value})} />
            </div>
            <div>
              <label className="label-field">Court Name</label>
              <input className="input-field" value={form.court} onChange={e => setForm({...form, court: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Hearing Date</label>
                <input type="date" className="input-field" value={form.hearingDate} onChange={e => setForm({...form, hearingDate: e.target.value})} />
              </div>
              <div>
                <label className="label-field">Filed On</label>
                <input type="date" className="input-field" value={form.filedOn} onChange={e => setForm({...form, filedOn: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label-field">Portfolio Value ($)</label>
              <input type="number" className="input-field" value={form.portfolioValue} onChange={e => setForm({...form, portfolioValue: e.target.value})} placeholder="0" />
            </div>
          </div>
        </div>
        {/* Full width fields */}
        <div className="mt-4 space-y-4">
          <div>
            <label className="label-field">Labels (comma-separated)</label>
            <input className="input-field" value={form.labels} onChange={e => setForm({...form, labels: e.target.value})} placeholder="pro-bono, high-profile" />
          </div>
          <div>
            <label className="label-field">Overview</label>
            <textarea className="input-field" rows={3} value={form.overview} onChange={e => setForm({...form, overview: e.target.value})} placeholder="Brief case description..." />
          </div>
        </div>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Case"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </PageShell>
  );
}
