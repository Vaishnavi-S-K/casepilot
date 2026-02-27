import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Pencil, Trash2, Paperclip, Upload, AlertTriangle } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import FilterBar from '../components/ui/FilterBar';
import Badge from '../components/ui/Badge';
import Paginator from '../components/ui/Paginator';
import Dialog from '../components/ui/Dialog';
import AlertDialog from '../components/ui/AlertDialog';
import { ShimmerTable } from '../components/ui/Shimmer';
import BlankSlate from '../components/ui/BlankSlate';
import { documentsAPI, casesAPI, uploadAPI } from '../api/client';
import { getUsers } from '../utils/authStore';
import { formatDate } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DOC_TYPES = ['Contract','Affidavit','Motion','Legal Brief','Evidence','Subpoena','Court Order','Settlement','NDA'];
const REVIEW_STATUSES = ['Draft','Submitted','Under Review','Approved','Filed','Rejected'];
const REVIEW_BADGE = { Draft:'gray', Submitted:'sky', 'Under Review':'amber', Approved:'teal', Filed:'emerald', Rejected:'rose' };

const emptyForm = { name:'', docType:'', caseId:'', reviewStatus:'Draft', preparedBy:'', dueBy:'', revision:1, remarks:'', labels:'', fileUrl:'' };

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search:'', reviewStatus:'', docType:'' });
  const debouncedSearch = useDebounce(filters.search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [cases, setCases] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef();
  const teamMembers = getUsers();

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.reviewStatus) params.reviewStatus = filters.reviewStatus;
      if (filters.docType) params.docType = filters.docType;
      const res = await documentsAPI.getAll(params);
      setDocs(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, filters.reviewStatus, filters.docType]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  useEffect(() => { casesAPI.getAll({ limit: 100 }).then(r => setCases(r.data||[])).catch(()=>{}); }, []);

  const handleFilter = (k,v) => { setFilters(p=>({...p,[k]:v})); setPage(1); };
  const clearFilters = () => { setFilters({search:'',reviewStatus:'',docType:''}); setPage(1); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErrors({}); setModalOpen(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({ name:d.name, docType:d.docType, caseId:d.caseId?._id||d.caseId||'', reviewStatus:d.reviewStatus, preparedBy:d.preparedBy||'', dueBy:d.dueBy?d.dueBy.slice(0,10):'', revision:d.revision||1, remarks:d.remarks||'', labels:(d.labels||[]).join(', '), fileUrl:d.fileUrl||'' });
    setFormErrors({}); setModalOpen(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.docType) e.docType = 'Document type is required';
    if (!form.reviewStatus) e.reviewStatus = 'Status is required';
    setFormErrors(e);
    return Object.keys(e).length===0;
  };

  const handleUpload = async (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(30);
      const res = await uploadAPI.upload(file);
      setUploadProgress(100);
      setForm(p => ({ ...p, fileUrl: res.data.fileUrl }));
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); setTimeout(() => setUploadProgress(0), 500); }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    try {
      setSaving(true);
      const payload = { ...form, revision: Number(form.revision)||1, labels: form.labels ? form.labels.split(',').map(l=>l.trim()).filter(Boolean) : [] };
      if (editing) { await documentsAPI.update(editing._id, payload); toast.success('Document updated'); }
      else { await documentsAPI.create(payload); toast.success('Document created'); }
      setModalOpen(false); fetchDocs();
    } catch(err) { toast.error(err.response?.data?.error||'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try { setDeleting(true); await documentsAPI.remove(deleteTarget._id); toast.success('Document deleted'); setDeleteTarget(null); fetchDocs(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <PageShell>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Documents</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-badge">{total}</span>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Document</button>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <FilterBar
          filters={[
            { key:'docType', label:'Doc Type', options: DOC_TYPES },
            { key:'reviewStatus', label:'Status', options: REVIEW_STATUSES },
          ]}
          values={filters} onChange={handleFilter} onClear={clearFilters}
        />
      </AnimatedItem>

      <AnimatedItem>
        {loading ? <ShimmerTable rows={6} /> : docs.length===0 ? (
          <BlankSlate title="No documents found" description="Upload or create a new document" actionLabel="Add Document" onAction={openCreate} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Name</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Doc Type</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Case</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Prepared By</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Rev</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Due By</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Remarks</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">File</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Actions</th>
                </tr></thead>
                <tbody>
                  {docs.map((d,i) => {
                    const overdue = d.dueBy && new Date(d.dueBy) < new Date() && !['Filed','Approved'].includes(d.reviewStatus);
                    return (
                      <tr key={d._id} className={`border-t border-gray-50 hover:bg-cp-base transition-colors group ${i%2===1?'bg-gray-50/30':''}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-2.5"><Badge label={d.docType} color="indigo" /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{d.caseId?.ref||'—'}</td>
                        <td className="px-4 py-2.5"><Badge label={d.reviewStatus} color={REVIEW_BADGE[d.reviewStatus]||'gray'} /></td>
                        <td className="px-4 py-2.5 text-xs text-gray-600">{d.preparedBy||'—'}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500">v{d.revision}</td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className={overdue?'text-red-600 font-semibold':'text-gray-600'}>{formatDate(d.dueBy)}</span>
                          {overdue && <AlertTriangle size={12} className="inline ml-1 text-red-500" />}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 max-w-[150px] truncate" title={d.remarks||''}>{d.remarks||'—'}</td>
                        <td className="px-4 py-2.5">
                          {d.fileUrl ? <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700"><Paperclip size={14} /></a> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>openEdit(d)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Pencil size={14} /></button>
                            <button onClick={()=>setDeleteTarget(d)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button>
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
        )}
      </AnimatedItem>

      {/* Modal */}
      <Dialog isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Document':'Add Document'} size="lg"
        footer={<><button onClick={()=>setModalOpen(false)} className="btn-ghost">Cancel</button><button onClick={handleSave} className="btn-primary" disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button></>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Name *</label>
            <input className={`input-field ${formErrors.name?'border-rose-400':''}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="label-field">Doc Type *</label>
            <select className={`select-field ${formErrors.docType?'border-rose-400':''}`} value={form.docType} onChange={e=>setForm({...form,docType:e.target.value})}>
              <option value="">Select type</option>
              {DOC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            {formErrors.docType && <p className="text-xs text-rose-500 mt-1">{formErrors.docType}</p>}
          </div>
          <div>
            <label className="label-field">Case</label>
            <select className="select-field" value={form.caseId} onChange={e=>setForm({...form,caseId:e.target.value})}>
              <option value="">Select case</option>
              {cases.map(c=><option key={c._id} value={c._id}>{c.ref} — {c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Review Status *</label>
            <select className="select-field" value={form.reviewStatus} onChange={e=>setForm({...form,reviewStatus:e.target.value})}>
              {REVIEW_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Prepared By</label>
            <select className="select-field" value={form.preparedBy} onChange={e=>setForm({...form,preparedBy:e.target.value})}>
              <option value="">Select</option>
              {teamMembers.map(m=><option key={m.email} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Due By</label>
            <input type="date" className="input-field" value={form.dueBy} onChange={e=>setForm({...form,dueBy:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Revision #</label>
            <input type="number" min="1" className="input-field" value={form.revision} onChange={e=>setForm({...form,revision:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Labels (comma-separated)</label>
            <input className="input-field" value={form.labels} onChange={e=>setForm({...form,labels:e.target.value})} placeholder="confidential, urgent" />
          </div>
        </div>
        <div className="mt-4">
          <label className="label-field">Remarks</label>
          <textarea className="input-field" rows={2} value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})} />
        </div>
        {/* File upload */}
        <div className="mt-4">
          <label className="label-field">File Upload</label>
          <div
            onClick={()=>fileRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 rounded-card p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors"
          >
            <Upload size={24} className="mx-auto text-indigo-400 mb-2" />
            <p className="text-sm text-gray-500">Drop files here or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Image (max 20MB)</p>
            <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp" />
          </div>
          {uploading && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{width:`${uploadProgress}%`}} />
            </div>
          )}
          {form.fileUrl && (
            <div className="mt-2 flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-input">
              <Paperclip size={14} className="text-teal-600" />
              <a href={form.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-teal-700 hover:underline flex-1 truncate">{form.fileUrl}</a>
              <button onClick={()=>setForm({...form,fileUrl:''})} className="text-gray-400 hover:text-rose-500 text-sm">×</button>
            </div>
          )}
        </div>
      </Dialog>

      <AlertDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Document" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`} />
    </PageShell>
  );
}
