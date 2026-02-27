import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import QuickSearch from './components/QuickSearch';
import AlertsDrawer from './components/AlertsDrawer';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseProfile from './pages/CaseProfile';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import CalendarView from './pages/CalendarView';
import Insights from './pages/Insights';
import MyAccount from './pages/MyAccount';
import TeamMembers from './pages/TeamMembers';

import { getSession } from './utils/authStore';

/* Auth guard wrapper */
function RequireAuth({ children }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

/* Layout with sidebar + topbar */
function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* Ctrl+K global shortcut */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleCountUpdate = useCallback((c) => setUnreadCount(c), []);

  return (
    <div className="flex h-screen overflow-hidden bg-cp-base">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onOpenSearch={() => setSearchOpen(true)}
          onOpenAlerts={() => setAlertsOpen(true)}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <Outlet />
          </AnimatePresence>
        </main>
      </div>

      {/* Global panels */}
      <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AlertsDrawer isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} onCountUpdate={handleCountUpdate} />
    </div>
  );
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/:id" element={<CaseProfile />} />
          <Route path="documents" element={<Documents />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="clients" element={<Clients />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="insights" element={<Insights />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="team" element={<TeamMembers />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}
