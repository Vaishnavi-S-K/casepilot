import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import Dialog from '../components/ui/Dialog';
import AlertDialog from '../components/ui/AlertDialog';
import { getUsers, addUser, updateUser, deleteUser, getSession } from '../utils/authStore';
import { avatarColor, initials } from '../utils/formatters';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

const ROLES = ['Admin','Partner','Senior Associate','Associate','Paralegal'];

const emptyForm = { name:'', email:'', password:'Pilot2026', role:'Associate', isAdmin:false };

export default function TeamMembers() {
  const session = getSession();
  if (!session?.isAdmin) return <Navigate to="/dashboard" replace />;

  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadMembers = () => setMembers(getUsers());
  useEffect(() => { loadMembers(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormErrors({}); setModalOpen(true); };
  const openEdit = (m) => {
    setEditing(m); setForm({ name:m.name, email:m.email, password:m.password, role:m.role, isAdmin:!!m.isAdmin }); setFormErrors({}); setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 4) e.password = 'Min 4 chars';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editing) {
      updateUser(editing.email, { name: form.name, role: form.role, password: form.password, isAdmin: form.isAdmin });
      toast.success('Member updated');
    } else {
      const existing = getUsers().find(u => u.email === form.email);
      if (existing) { toast.error('Email already exists'); return; }
      addUser(form);
      toast.success('Member added');
    }
    setModalOpen(false);
    loadMembers();
  };

  const handleDelete = () => {
    if (deleteTarget.email === session.email) { toast.error("Can't delete yourself"); setDeleteTarget(null); return; }
    deleteUser(deleteTarget.email);
    toast.success('Member removed');
    setDeleteTarget(null);
    loadMembers();
  };

  return (
    <PageShell>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-extrabold text-gray-900">Team Members</h1>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-badge">{members.length}</span>
          </div>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Member</button>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-left">
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Member</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Email</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Role</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Admin</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Password</th>
                <th className="px-4 py-2.5 font-semibold text-gray-600 text-xs">Actions</th>
              </tr></thead>
              <tbody>
                {members.map((m,i) => (
                  <tr key={m.email} className={`border-t border-gray-50 hover:bg-cp-base transition-colors group ${i%2===1?'bg-gray-50/30':''}`}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(m.name)}`}>{initials(m.name)}</div>
                        <span className="font-medium text-gray-900">{m.name}</span>
                        {m.email === session.email && <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">You</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500">{m.email}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={m.role} color={m.role==='Admin'?'indigo':m.role==='Partner'?'violet':'gray'} size="sm" />
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => { updateUser(m.email, { isAdmin: !m.isAdmin }); loadMembers(); toast.success(`Admin ${m.isAdmin ? 'revoked' : 'granted'}`); }}
                        disabled={m.email === session.email}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-badge text-[11px] font-semibold transition-colors ${
                          m.isAdmin ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${m.email === session.email ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <ShieldCheck size={12} />{m.isAdmin ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-400">{m.password}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>openEdit(m)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"><Pencil size={14} /></button>
                        <button onClick={()=>setDeleteTarget(m)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded" disabled={m.email===session.email}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedItem>

      {/* Modal */}
      <Dialog isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Member':'Add Member'} size="md"
        footer={<><button onClick={()=>setModalOpen(false)} className="btn-ghost">Cancel</button><button onClick={handleSave} className="btn-primary">{editing?'Update':'Add'}</button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="label-field">Name *</label>
            <input className={`input-field ${formErrors.name?'border-rose-400':''}`} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Email *</label>
            <input type="email" className={`input-field ${formErrors.email?'border-rose-400':''} ${editing?'bg-gray-50 cursor-not-allowed':''}`} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} disabled={!!editing} />
          </div>
          <div>
            <label className="label-field">Password *</label>
            <input className={`input-field ${formErrors.password?'border-rose-400':''}`} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          </div>
          <div>
            <label className="label-field">Role</label>
            <select className="select-field" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
              {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input type="checkbox" checked={form.isAdmin} onChange={e=>setForm({...form,isAdmin:e.target.checked})} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400" />
            <span className="text-sm text-gray-700">Grant admin privileges</span>
          </label>
        </div>
      </Dialog>

      <AlertDialog isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete} title="Remove Member" message={`Remove "${deleteTarget?.name}" from the team?`} />
    </PageShell>
  );
}
