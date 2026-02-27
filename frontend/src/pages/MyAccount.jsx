import { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import { getSession, setSession, updateUser, getUserByEmail } from '../utils/authStore';
import { avatarColor, initials } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function MyAccount() {
  const session = getSession();
  const user = getUserByEmail(session?.email) || session || {};

  const [profile, setProfile] = useState({ name: user.name || '', email: user.email || '', role: user.role || '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = () => {
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    setTimeout(() => {
      updateUser(user.email, { name: profile.name, role: profile.role });
      setSession({ ...session, name: profile.name, role: profile.role });
      toast.success('Profile updated');
      setSavingProfile(false);
    }, 400);
  };

  const handlePwSave = () => {
    if (!pw.current) { toast.error('Enter current password'); return; }
    if (pw.current !== user.password) { toast.error('Current password is incorrect'); return; }
    if (pw.next.length < 4) { toast.error('New password must be at least 4 characters'); return; }
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    setTimeout(() => {
      updateUser(user.email, { password: pw.next });
      toast.success('Password changed');
      setPw({ current: '', next: '', confirm: '' });
      setSavingPw(false);
    }, 400);
  };

  return (
    <PageShell>
      <AnimatedItem>
        <h1 className="text-2xl font-heading font-extrabold text-gray-900 mb-6">My Account</h1>
      </AnimatedItem>

      {/* Profile Header */}
      <AnimatedItem>
        <div className="card p-6 flex items-center gap-5 mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${avatarColor(user.name||'U')}`}>
            {initials(user.name||'User')}
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-badge font-medium">{user.role}</span>
          </div>
        </div>
      </AnimatedItem>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Profile */}
        <AnimatedItem>
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-indigo-600" />
              <h3 className="font-heading font-semibold text-gray-800">Edit Profile</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-field">Full Name</label>
                <input className="input-field" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input className="input-field bg-gray-50 cursor-not-allowed" value={profile.email} disabled />
                <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="label-field">Role</label>
                <select className="select-field" value={profile.role} onChange={e=>setProfile({...profile,role:e.target.value})}>
                  <option value="Admin">Admin</option>
                  <option value="Partner">Partner</option>
                  <option value="Senior Associate">Senior Associate</option>
                  <option value="Associate">Associate</option>
                  <option value="Paralegal">Paralegal</option>
                </select>
              </div>
              <button onClick={handleProfileSave} className="btn-primary flex items-center gap-2" disabled={savingProfile}>
                <Save size={14} />{savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </AnimatedItem>

        {/* Change Password */}
        <AnimatedItem>
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={18} className="text-indigo-600" />
              <h3 className="font-heading font-semibold text-gray-800">Change Password</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label-field">Current Password</label>
                <input type="password" className="input-field" value={pw.current} onChange={e=>setPw({...pw,current:e.target.value})} />
              </div>
              <div>
                <label className="label-field">New Password</label>
                <input type="password" className="input-field" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})} />
              </div>
              <div>
                <label className="label-field">Confirm New Password</label>
                <input type="password" className="input-field" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})} />
              </div>
              <button onClick={handlePwSave} className="btn-primary flex items-center gap-2" disabled={savingPw}>
                <Lock size={14} />{savingPw ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </AnimatedItem>
      </div>
    </PageShell>
  );
}
