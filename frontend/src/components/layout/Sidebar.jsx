import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import {
  LayoutDashboard, Briefcase, FileText, ListChecks, Users,
  CalendarDays, BarChart3, User, Shield, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getSession, clearSession } from '../../utils/authStore';
import { initials, avatarColor } from '../../utils/formatters';

const navItems = [
  { group: 'MAIN', items: [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cases', icon: Briefcase, label: 'Cases' },
    { to: '/documents', icon: FileText, label: 'Documents' },
    { to: '/tasks', icon: ListChecks, label: 'Tasks' },
    { to: '/clients', icon: Users, label: 'Clients' },
  ]},
  { group: 'ANALYTICS', items: [
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/insights', icon: BarChart3, label: 'Insights' },
  ]},
  { group: 'ACCOUNT', items: [
    { to: '/account', icon: User, label: 'My Account' },
    { to: '/team', icon: Shield, label: 'Team', adminOnly: true },
  ]},
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, label: '', top: 0 });
  const session = getSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <aside
      className={`h-screen bg-cp-sidebar flex flex-col flex-shrink-0 z-40 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-indigo-800">
        <span className="text-2xl">🏛️</span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-indigo-300 hover:text-white transition-colors"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        {!collapsed && (
          <span className="text-white font-heading font-extrabold text-lg tracking-tight">
            Advocourt
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        {navItems.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-4 text-[10px] font-semibold text-indigo-400 uppercase tracking-widest mb-2">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                if (item.adminOnly && !session?.isAdmin) return null;
                const Icon = item.icon;
                return (
                  <li
                    key={item.to}
                    className="relative group/nav"
                    onMouseEnter={(e) => {
                      if (!collapsed) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ visible: true, label: item.label, top: rect.top + rect.height / 2 });
                    }}
                    onMouseLeave={() => setTooltip({ ...tooltip, visible: false })}
                  >
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-900 text-teal-300 border-l-[3px] border-teal-400 shadow-lg shadow-indigo-900/40'
                            : 'text-indigo-200 hover:bg-indigo-900/50 hover:text-white hover:translate-x-1 border-l-[3px] border-transparent'
                        }`
                      }
                    >
                      <Icon size={18} className="transition-transform duration-200 group-hover/nav:scale-110" />
                      {!collapsed && <span className="transition-all duration-200 group-hover/nav:tracking-wide">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-indigo-800 p-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(session?.name)}`}>
            {initials(session?.name)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{session?.name}</p>
              <p className="text-[11px] text-indigo-300 truncate">{session?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-indigo-300 hover:text-rose-400 transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Floating tooltip for collapsed sidebar */}
      {tooltip.visible && collapsed && (
        <div
          className="fixed z-[9999] px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold whitespace-nowrap border border-indigo-400/60 shadow-xl shadow-indigo-900/30 pointer-events-none"
          style={{ left: '88px', top: `${tooltip.top}px`, transform: 'translateY(-50%)' }}
        >
          {tooltip.label}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[5px] w-2.5 h-2.5 bg-indigo-600 border-l border-b border-indigo-400/60 rotate-45" />
        </div>
      )}
    </aside>
  );
}
