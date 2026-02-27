import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, List, LayoutGrid, Building2, Mail, Phone, MapPin } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import FilterBar from '../components/ui/FilterBar';
import Badge from '../components/ui/Badge';
import Paginator from '../components/ui/Paginator';
import Dialog from '../components/ui/Dialog';
import AlertDialog from '../components/ui/AlertDialog';
import { ShimmerTable, ShimmerCard } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import { clientsAPI } from '../api/client';
import { formatCurrency, formatDate, tierColor, avatarColor, initials } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import useLocalStorage from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

const CLIENT_TYPES = ['Individual','Corporation','Government','Non-Profit'];
const TIERS = ['Standard','Premium','VIP'];
const STANDINGS = ['Active','Inactive','Suspended'];

const emptyForm = { fullName:'', email:'', mobile:'', organisation:'', clientType:'Individual', city:'', country:'', tier:'Standard', standing:'Active', internalNotes:'' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', clientType:'', tier:'', standing:'' });
  const debouncedSearch = useDebounce(filters.search);
  const [view, setView] = useLocalStorage('cp-client-view','card');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.clientType) params.clientType = filters.clientType;
      if (filters.tier) params.tier = filters.tier;
      if (filters.standing) params.standing = filters.standing;
      const res = await clientsAPI.getAll(params);
      setClients(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filters.clientType, filters.tier, filters.standing]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleFilter = (k,v) => { setFilters(p=>({...p,[k]:v})); setPage(1); };
  const clearFilters = () => { setFilters({search:'',clientType:'',tier:'',standing:''}); setPage(1); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErrors({}); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ fullName:c.fullName, email:c.email, mobile:c.mobile||'', organisation:c.organisation||'', clientType:c.clientType, city:c.city||'', country:c.country||'', tier:c.tier, standing:c.standing||'Active', internalNotes:c.internalNotes||'' });
    setFormErrors({}); setModalOpen(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    setFormErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      if (editing) { await clientsAPI.update(editing._id, form); toast.success('Client updated'); }
      else { await clientsAPI.create(form); toast.success('Client created'); }
      setModalOpen(false); fetchClients();
    } catch(err) { toast.error(err.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { setDeleting(true); await clientsAPI.remove(deleteTarget._id); toast.success('Client deleted'); setDeleteTarget(null); fetchClients(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const standingColor = (s) => ({ Active:'emerald', Inactive:'gray', Suspended:'rose' }[s]||'gray');

  return (
    <PageShell>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Clients</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-badge">{total}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-cp-border rounded-input">
              <button onClick={()=>setView('card')} className={`p-2 rounded-l-input ${view==='card'?'bg-indigo-50 text-indigo-600':'text-gray-400'}`}><LayoutGrid size={16} /></button>
              <button onClick={()=>setView('table')} className={`p-2 rounded-r-input ${view==='table'?'bg-indigo-50 text-indigo-600':'text-gray-400'}`}><List size={16} /></button>
            </div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Client</button>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <FilterBar
          filters={[
            { key:'clientType', label:'Type', options: CLIENT_TYPES },
            { key:'tier', label:'Tier', options: TIERS },
            { key:'standing', label:'Standing', options: STANDINGS },
          ]}
          values={filters} onChange={handleFilter} onClear={clearFilters}
        />
      </AnimatedItem>

      <AnimatedItem>
        {loading ? (view==='card' ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i)=><ShimmerCard key={i} />)}</div> : <ShimmerTable rows={6} />) : clients.length===0 ? (
          <BlankSlate title="No clients found" description="Add your first client" actionLabel="Add Client" onAction={openCreate} />
        ) : view==='card' ? (
          /* ------- CARD VIEW ------- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map(c => (
              <div key={c._id} className="card p-5 hover:shadow-card-hover transition-shadow group">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarColor(c.fullName)}`}>
                    {initials(c.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{c.fullName}</h3>
                    <p className="text-xs text-gray-500 truncate">{c.organisation||c.clientType}</p>
                  </div>
                  <Badge label={c.tier} color={tierColor(c.tier)} size="sm" />
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} /><span className="truncate">{c.email}</span></div>
                  {c.mobile && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} />{c.mobile}</div>}
                  {(c.city||c.country) && <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={12} />{[c.city,c.country].filter(Boolean).join(', ')}</div>}
                  {c.organisation && <div className="flex items-center gap-2 text-xs text-gray-500"><Building2 size={12} />{c.organisation}</div>}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge label={c.standing||'Active'} color={standingColor(c.standing)} size="sm" />
                  <span className="text-xs text-gray-400">Open: {c.openCases||0} / Closed: {c.closedCases||0}</span>
                </div>
                {c.billedTotal > 0 && <p className="text-sm font-semibold text-indigo-600 mb-3">{formatCurrency(c.billedTotal)} billed</p>}
                <div className="flex items-center gap-1 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>openEdit(c)} className="flex-1 btn-ghost text-xs">Edit</button>
                  <button onClick={()=>setDeleteTarget(c)} className="flex-1 btn-danger text-xs">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ------- TABLE VIEW ------- */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Email</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Organisation</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Type</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Tier</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Standing</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Billed</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Actions</th>
                </tr></thead>
                <tbody>
                  {clients.map((c,i) => (
                    <tr key={c._id} className={`border-t border-gray-50 hover:bg-cp-base transition-colors group ${i%2===1?'bg-gray-50/30':''}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${avatarColor(c.fullName)}`}>{initials(c.fullName)}</div>
                          <span className="font-medium text-gray-900">{c.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{c.email}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{c.organisation||'—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{c.clientType}</td>
                      <td className="px-4 py-2.5"><Badge label={c.tier} color={tierColor(c.tier)} size="sm" /></td>
                      <td className="px-4 py-2.5"><Badge label={c.standing||'Active'} color={standingColor(c.standing)} size="sm" /></td>
                      <td className="px-4 py-2.5 text-xs font-semibold text-gray-700">{formatCurrency(c.billedTotal||0)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>openEdit(c)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Pencil size={14} /></button>
                          <button onClick={()=>setDeleteTarget(c)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-cp-border"><Paginator page={page} pages={pages} total={total} limit={12} onPageChange={setPage} /></div>
          </div>
        )}
      </AnimatedItem>

      {/* Modal */}
      <Dialog isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Client':'Add Client'} size="lg"
        footer={<><button onClick={()=>setModalOpen(false)} className="btn-ghost">Cancel</button><button onClick={handleSave} className="btn-primary" disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button></>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Full Name *</label>
            <input className={`input-field ${formErrors.fullName?'border-rose-400':''}`} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} />
            {formErrors.fullName && <p className="text-xs text-rose-500 mt-1">{formErrors.fullName}</p>}
          </div>
          <div>
            <label className="label-field">Email *</label>
            <input type="email" className={`input-field ${formErrors.email?'border-rose-400':''}`} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
          </div>
          <div>
            <label className="label-field">Mobile</label>
            <input className="input-field" value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Organisation</label>
            <input className="input-field" value={form.organisation} onChange={e=>setForm({...form,organisation:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Client Type</label>
            <select className="select-field" value={form.clientType} onChange={e=>setForm({...form,clientType:e.target.value})}>
              {CLIENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Tier</label>
            <select className="select-field" value={form.tier} onChange={e=>setForm({...form,tier:e.target.value})}>
              {TIERS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">City</label>
            <input className="input-field" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Country</label>
            <input className="input-field" value={form.country} onChange={e=>setForm({...form,country:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Standing</label>
            <select className="select-field" value={form.standing} onChange={e=>setForm({...form,standing:e.target.value})}>
              {STANDINGS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Internal Notes</label>
            <textarea className="input-field" rows={2} value={form.internalNotes} onChange={e=>setForm({...form,internalNotes:e.target.value})} />
          </div>
        </div>
      </Dialog>

      <AlertDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Client" message={`Delete "${deleteTarget?.fullName}"? This cannot be undone.`} />
    </PageShell>
  );
}
