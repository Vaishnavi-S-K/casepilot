import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, List, LayoutGrid, GripVertical, CheckCircle2, Circle, Clock } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import FilterBar from '../components/ui/FilterBar';
import Badge from '../components/ui/Badge';
import Paginator from '../components/ui/Paginator';
import Dialog from '../components/ui/Dialog';
import AlertDialog from '../components/ui/AlertDialog';
import MiniProgress from '../components/ui/MiniProgress';
import { ShimmerTable } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import { tasksAPI, casesAPI } from '../api/client';
import { getUsers } from '../utils/authStore';
import { formatDate, urgencyColor } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import useLocalStorage from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

const STAGES = ['Backlog','To Do','In Progress','In Review','Blocked','Done'];
const URGENCY = ['Low','Medium','High','Critical'];
const STAGE_COLOR = { Backlog:'gray', 'To Do':'sky', 'In Progress':'indigo', 'In Review':'amber', Blocked:'rose', Done:'emerald' };

const emptyForm = { title:'', details:'', caseId:'', owner:'', urgency:'Medium', stage:'To Do', deadline:'', plannedHours:'', loggedHours:'', progress:0, checklist:[] };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', stage:'', urgency:'', owner:'' });
  const debouncedSearch = useDebounce(filters.search);
  const [view, setView] = useLocalStorage('cp-task-view','list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cases, setCases] = useState([]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const teamMembers = getUsers();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: view==='board'?200:10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.stage) params.stage = filters.stage;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.owner) params.owner = filters.owner;
      const res = await tasksAPI.getAll(params);
      setTasks(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filters.stage, filters.urgency, filters.owner, view]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { casesAPI.getAll({ limit:100 }).then(r=>setCases(r.data||[])).catch(()=>{}); }, []);

  const handleFilter = (k,v) => { setFilters(p=>({...p,[k]:v})); setPage(1); };
  const clearFilters = () => { setFilters({search:'',stage:'',urgency:'',owner:''}); setPage(1); };

  const openCreate = (preStage) => { 
    setEditing(null); 
    setForm({...emptyForm, stage: preStage||'To Do'}); 
    setFormErrors({}); 
    setNewCheckItem('');
    setModalOpen(true); 
  };
  const openEdit = (t) => {
    setEditing(t);
    setForm({
      title:t.title, details:t.details||'', caseId:t.caseId?._id||t.caseId||'', owner:t.owner||'', urgency:t.urgency, stage:t.stage,
      deadline:t.deadline?t.deadline.slice(0,10):'', plannedHours:t.plannedHours||'', loggedHours:t.loggedHours||'', progress:t.progress||0,
      checklist: t.checklist||[]
    });
    setFormErrors({}); setNewCheckItem(''); setModalOpen(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    setFormErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = {...form, plannedHours:Number(form.plannedHours)||0, loggedHours:Number(form.loggedHours)||0, progress:Number(form.progress)||0 };
      if (editing) { await tasksAPI.update(editing._id, payload); toast.success('Task updated'); }
      else { await tasksAPI.create(payload); toast.success('Task created'); }
      setModalOpen(false); fetchTasks();
    } catch(err) { toast.error(err.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { setDeleting(true); await tasksAPI.remove(deleteTarget._id); toast.success('Task deleted'); setDeleteTarget(null); fetchTasks(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setForm(p => ({...p, checklist:[...p.checklist, {text:newCheckItem.trim(), done:false}]}));
    setNewCheckItem('');
  };
  const toggleCheckItem = (idx) => {
    const cl = [...form.checklist]; cl[idx] = {...cl[idx], done:!cl[idx].done}; setForm(p=>({...p,checklist:cl}));
  };
  const removeCheckItem = (idx) => {
    setForm(p=>({...p, checklist:p.checklist.filter((_,i)=>i!==idx)}));
  };

  /* Quick stage change on board drag */
  const handleDragStart = (e, t) => { e.dataTransfer.setData('taskId', t._id); };
  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;
    try {
      await tasksAPI.update(id, { stage: newStage });
      fetchTasks();
    } catch { toast.error('Move failed'); }
  };

  return (
    <PageShell>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Tasks</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-badge">{total}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border border-cp-border rounded-input">
              <button onClick={()=>setView('list')} className={`p-2 rounded-l-input ${view==='list'?'bg-indigo-50 text-indigo-600':'text-gray-400'}`}><List size={16} /></button>
              <button onClick={()=>setView('board')} className={`p-2 rounded-r-input ${view==='board'?'bg-indigo-50 text-indigo-600':'text-gray-400'}`}><LayoutGrid size={16} /></button>
            </div>
            <button onClick={()=>openCreate()} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Task</button>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <FilterBar
          filters={[
            { key:'stage', label:'Stage', options: STAGES },
            { key:'urgency', label:'Urgency', options: URGENCY },
            { key:'owner', label:'Owner', options: teamMembers.map(m=>m.name) },
          ]}
          values={filters} onChange={handleFilter} onClear={clearFilters}
        />
      </AnimatedItem>

      <AnimatedItem>
        {loading ? <ShimmerTable rows={6} /> : tasks.length===0 ? (
          <BlankSlate title="No tasks found" description="Create your first task to get started" actionLabel="Add Task" onAction={openCreate} />
        ) : view==='list' ? (
          /* ------- TABLE VIEW ------- */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Title</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Case</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Owner</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Stage</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Urgency</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Deadline</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Progress</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Actions</th>
                </tr></thead>
                <tbody>
                  {tasks.map((t,i) => {
                    const overdue = t.deadline && new Date(t.deadline) < new Date() && t.stage!=='Done';
                    return (
                      <tr key={t._id} className={`border-t border-gray-50 hover:bg-cp-base transition-colors group ${i%2===1?'bg-gray-50/30':''}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{t.title}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{t.caseId?.ref||'—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{t.owner||'—'}</td>
                        <td className="px-4 py-2.5"><Badge label={t.stage} color={STAGE_COLOR[t.stage]||'gray'} /></td>
                        <td className="px-4 py-2.5"><Badge label={t.urgency} color={urgencyColor(t.urgency)} /></td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className={overdue?'text-red-600 font-semibold':'text-gray-600'}>{formatDate(t.deadline)}</span>
                          {overdue && <Clock size={12} className="inline ml-1 text-red-500" />}
                        </td>
                        <td className="px-4 py-2.5 w-28"><MiniProgress value={t.progress||0} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Pencil size={14} /></button>
                            <button onClick={()=>setDeleteTarget(t)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-cp-border"><Paginator page={page} pages={pages} total={total} limit={10} onPageChange={setPage} /></div>
          </div>
        ) : (
          /* ------- BOARD VIEW ------- */
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map(stage => {
              const items = tasks.filter(t=>t.stage===stage);
              return (
                <div
                  key={stage}
                  className="min-w-[260px] max-w-[300px] flex-shrink-0 bg-white rounded-card border border-cp-border"
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>handleDrop(e,stage)}
                >
                  <div className="flex items-center justify-between px-3 py-2.5 border-b border-cp-border">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full bg-${STAGE_COLOR[stage]}-500`} />
                      <span className="text-sm font-semibold text-gray-700">{stage}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">{items.length}</span>
                      <button onClick={()=>openCreate(stage)} className="p-0.5 text-gray-400 hover:text-indigo-600"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px] max-h-[520px] overflow-y-auto">
                    {items.map(t => (
                      <div key={t._id} draggable onDragStart={e=>handleDragStart(e,t)}
                        className="bg-cp-base rounded-lg p-3 border border-transparent hover:border-indigo-200 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group/card"
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-sm font-medium text-gray-900 leading-tight">{t.title}</span>
                          <GripVertical size={14} className="text-gray-300 flex-shrink-0 mt-0.5" />
                        </div>
                        {t.caseId?.ref && <p className="text-[10px] font-mono text-gray-400 mb-1.5">{t.caseId.ref}</p>}
                        <div className="flex items-center gap-1.5 mb-2">
                          <Badge label={t.urgency} color={urgencyColor(t.urgency)} size="sm" />
                          {t.deadline && <span className="text-[10px] text-gray-400">{formatDate(t.deadline)}</span>}
                        </div>
                        <MiniProgress value={t.progress||0} />
                        <div className="flex items-center justify-between mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          <span className="text-[10px] text-gray-400">{t.owner||'Unassigned'}</span>
                          <div className="flex gap-1">
                            <button onClick={()=>openEdit(t)} className="text-gray-400 hover:text-indigo-600"><Pencil size={12} /></button>
                            <button onClick={()=>setDeleteTarget(t)} className="text-gray-400 hover:text-rose-600"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AnimatedItem>

      {/* Modal */}
      <Dialog isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Task':'Add Task'} size="lg"
        footer={<><button onClick={()=>setModalOpen(false)} className="btn-ghost">Cancel</button><button onClick={handleSave} className="btn-primary" disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button></>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label-field">Title *</label>
            <input className={`input-field ${formErrors.title?'border-rose-400':''}`} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            {formErrors.title && <p className="text-xs text-rose-500 mt-1">{formErrors.title}</p>}
          </div>
          <div className="md:col-span-2">
            <label className="label-field">Details</label>
            <textarea className="input-field" rows={2} value={form.details} onChange={e=>setForm({...form,details:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Case</label>
            <select className="select-field" value={form.caseId} onChange={e=>setForm({...form,caseId:e.target.value})}>
              <option value="">Select case</option>
              {cases.map(c=><option key={c._id} value={c._id}>{c.ref} — {c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Owner</label>
            <select className="select-field" value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}>
              <option value="">Select</option>
              {teamMembers.map(m=><option key={m.email} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Urgency</label>
            <select className="select-field" value={form.urgency} onChange={e=>setForm({...form,urgency:e.target.value})}>
              {URGENCY.map(u=><option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Stage</label>
            <select className="select-field" value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})}>
              {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Deadline</label>
            <input type="date" className="input-field" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Progress (%)</label>
            <input type="range" min="0" max="100" step="5" value={form.progress} onChange={e=>setForm({...form,progress:Number(e.target.value)})}
              className="w-full h-2 accent-indigo-600 cursor-pointer" />
            <span className="text-xs text-gray-500">{form.progress}%</span>
          </div>
          <div>
            <label className="label-field">Planned Hours</label>
            <input type="number" min="0" step="0.5" className="input-field" value={form.plannedHours} onChange={e=>setForm({...form,plannedHours:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Logged Hours</label>
            <input type="number" min="0" step="0.5" className="input-field" value={form.loggedHours} onChange={e=>setForm({...form,loggedHours:e.target.value})} />
          </div>
        </div>

        {/* Checklist */}
        <div className="mt-5 border-t border-cp-border pt-4">
          <label className="label-field mb-2">Checklist</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
            {form.checklist.map((item,idx) => (
              <div key={idx} className="flex items-center gap-2 group/ck">
                <button onClick={()=>toggleCheckItem(idx)} className="text-gray-400 hover:text-indigo-600">
                  {item.done ? <CheckCircle2 size={16} className="text-teal-600" /> : <Circle size={16} />}
                </button>
                <span className={`text-sm flex-1 ${item.done?'line-through text-gray-400':'text-gray-700'}`}>{item.text}</span>
                <button onClick={()=>removeCheckItem(idx)} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover/ck:opacity-100 text-xs">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="input-field flex-1" placeholder="Add checklist item…" value={newCheckItem} onChange={e=>setNewCheckItem(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(e.preventDefault(),addCheckItem())} />
            <button type="button" onClick={addCheckItem} className="btn-ghost text-sm">Add</button>
          </div>
        </div>
      </Dialog>

      <AlertDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Task" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} />
    </PageShell>
  );
}
