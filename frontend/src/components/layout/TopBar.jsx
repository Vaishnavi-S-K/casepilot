import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Database, User, Shield, LogOut } from 'lucide-react';
import { getSession, clearSession } from '../../utils/authStore';
import { initials, avatarColor } from '../../utils/formatters';
import { seedAPI } from '../../api/client';
import toast from 'react-hot-toast';

const pageTitles = {
  '/': 'Dashboard',
  '/cases': 'Cases',
  '/documents': 'Documents',
  '/tasks': 'Tasks',
  '/clients': 'Clients',
  '/calendar': 'Calendar',
  '/insights': 'Insights',
  '/account': 'My Account',
  '/team': 'Team Members',
};

export default function TopBar({ onOpenSearch, onOpenAlerts, unreadCount }) {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [userMenu, setUserMenu] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const pathBase = '/' + location.pathname.split('/').filter(Boolean)[0] || '/';
  const pageTitle = pageTitles[pathBase] ||
    (location.pathname.startsWith('/cases/') ? 'Case Details' : 'Advocourt');

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedAPI.run();
      toast.success('Demo data seeded successfully!');
      window.location.reload();
    } catch {
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-14 bg-white border-b border-cp-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Page Title */}
      <div>
        <h2 className="font-heading font-bold text-lg text-gray-900">{pageTitle}</h2>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 border border-cp-border rounded-input text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400 font-mono">
            Ctrl+K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 text-gray-500 hover:text-indigo-600 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Seed button */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-600 border border-teal-300 rounded-input hover:bg-teal-50 transition-colors disabled:opacity-50"
        >
          <Database size={13} />
          {seeding ? 'Seeding...' : 'Seed DB'}
        </button>

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenu(!userMenu)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${avatarColor(session?.name)} ring-2 ring-white shadow-sm`}
            title={session?.name}
          >
            {initials(session?.name)}
          </button>
          {userMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
              <div className="absolute right-0 top-10 w-52 bg-white rounded-card border border-cp-border shadow-dropdown z-50 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{session?.name}</p>
                  <p className="text-xs text-gray-500">{session?.email}</p>
                </div>
                <button
                  onClick={() => { setUserMenu(false); navigate('/account'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={14} /> My Account
                </button>
                {session?.isAdmin && (
                  <button
                    onClick={() => { setUserMenu(false); navigate('/team'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Shield size={14} /> Team
                  </button>
                )}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => { clearSession(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
