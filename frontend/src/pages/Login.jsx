import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { findUser, setSession, getUsers } from '../utils/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showCreds, setShowCreds] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const user = findUser(email, password);
    if (!user) {
      setErrors({ form: 'Invalid email or password' });
      return;
    }
    setSession(user);
    toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    navigate('/');
  };

  const users = getUsers();

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="flex-[58] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🧭</span>
            <span className="text-3xl font-heading font-extrabold text-indigo-600">CasePilot</span>
          </div>
          <p className="text-gray-500 mb-8">Navigate Every Case with Clarity.</p>

          <div className="w-full h-px bg-gray-200 mb-8" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.form && (
              <div className="bg-rose-50 text-rose-600 text-sm px-4 py-2 rounded-input border border-rose-200">
                {errors.form}
              </div>
            )}

            <div>
              <label className="label-field">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
                className={`input-field ${errors.email ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                placeholder="you@casepilot.io"
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label-field">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
                  className={`input-field pr-10 ${errors.password ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
              />
              <span className="text-sm text-gray-600">Keep me signed in</span>
            </label>

            <button type="submit" className="w-full btn-primary py-2.5 text-base bg-gradient-to-r from-indigo-600 to-indigo-700">
              Sign In
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6">
            <button
              onClick={() => setShowCreds(!showCreds)}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-indigo-500 transition-colors"
            >
              {showCreds ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Demo credentials
            </button>
            {showCreds && (
              <div className="mt-3 overflow-hidden rounded-input border border-cp-border">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.email}
                        className="border-t border-gray-100 hover:bg-indigo-50 cursor-pointer"
                        onClick={() => { setEmail(u.email); setPassword(u.password); setErrors({}); }}
                      >
                        <td className="px-3 py-1.5 text-gray-700">{u.name}</td>
                        <td className="px-3 py-1.5 text-gray-500 font-mono">{u.email}</td>
                        <td className="px-3 py-1.5 text-gray-500 font-mono">{u.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:flex flex-[42] bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract decorative shapes */}
        <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-white/5 blur-sm" />
        <div className="absolute bottom-20 left-10 w-60 h-60 rounded-full bg-teal-400/10 blur-sm" />
        <div className="absolute top-1/3 left-1/4 w-20 h-20 rounded-lg bg-white/5 rotate-45" />

        <div className="relative z-10 text-white max-w-sm">
          {/* SVG illustration */}
          <svg viewBox="0 0 200 160" className="w-56 mb-8 mx-auto opacity-90">
            <rect x="50" y="20" width="100" height="120" rx="8" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
            <rect x="62" y="40" width="76" height="6" rx="3" fill="white" fillOpacity="0.3" />
            <rect x="62" y="55" width="50" height="4" rx="2" fill="white" fillOpacity="0.2" />
            <rect x="62" y="65" width="60" height="4" rx="2" fill="white" fillOpacity="0.2" />
            <circle cx="75" cy="95" r="15" fill="none" stroke="#5EEAD4" strokeWidth="2" strokeOpacity="0.6" />
            <path d="M 70 95 L 73 98 L 80 91" stroke="#5EEAD4" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="100" y="85" width="30" height="20" rx="4" fill="#5EEAD4" fillOpacity="0.2" stroke="#5EEAD4" strokeOpacity="0.4" strokeWidth="1" />
            <path d="M 30 80 L 30 60 L 50 60" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
            <circle cx="30" cy="80" r="3" fill="white" fillOpacity="0.3" />
          </svg>

          <div className="space-y-4 mb-10">
            <div className="flex items-start gap-3">
              <span className="text-xl">🧭</span>
              <p className="text-sm text-indigo-100">Smart case tracking across your entire firm</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">📂</span>
              <p className="text-sm text-indigo-100">Centralized documents with deadline alerts</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <p className="text-sm text-indigo-100">Task boards built for legal workflows</p>
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-card p-5">
            <p className="text-sm text-indigo-100 italic leading-relaxed mb-3">
              "CasePilot transformed how our team tracks deadlines. We reduced missed filings by 94% in the first quarter."
            </p>
            <p className="text-xs text-indigo-200 font-semibold">
              — Jordan T., Partner, Meridian Law Group
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
