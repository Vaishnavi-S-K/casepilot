import { useState, useEffect, useCallback } from 'react';
import { X, Bell, CheckCheck, Trash2 } from 'lucide-react';
import Badge from './ui/Badge';
import { notificationsAPI } from '../api/client';
import { timeAgo } from '../utils/formatters';
import toast from 'react-hot-toast';

const LEVEL_COLOR = { info:'indigo', success:'teal', warning:'amber', error:'rose' };
const LEVEL_BORDER = { info:'border-l-indigo-400', success:'border-l-teal-400', warning:'border-l-amber-400', error:'border-l-rose-400' };

export default function AlertsDrawer({ isOpen, onClose, onCountUpdate }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll({ limit: 40 });
      setAlerts(res.data || []);
      onCountUpdate?.(res.unreadCount ?? 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [onCountUpdate]);

  useEffect(() => { if (isOpen) fetchAlerts(); }, [isOpen, fetchAlerts]);

  /* Poll every 30s while open */
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(fetchAlerts, 30000);
    return () => clearInterval(id);
  }, [isOpen, fetchAlerts]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.readAll();
      fetchAlerts();
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const handleClearAll = async () => {
    try {
      await notificationsAPI.clearAll();
      setAlerts([]);
      onCountUpdate?.(0);
      toast.success('Notifications cleared');
    } catch { toast.error('Failed'); }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-[80]" onClick={onClose} />}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[90] transform transition-transform duration-300 ${isOpen?'translate-x-0':'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cp-border">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-indigo-600" />
            <h2 className="font-heading font-bold text-gray-900">Notifications</h2>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-badge">{alerts.length}</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded"><X size={18} /></button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-50">
          <button onClick={handleMarkAllRead} className="btn-ghost text-xs flex items-center gap-1"><CheckCheck size={12} /> Mark all read</button>
          <button onClick={handleClearAll} className="btn-ghost text-xs flex items-center gap-1 text-rose-500 hover:text-rose-600"><Trash2 size={12} /> Clear all</button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 110px)' }}>
          {loading && alerts.length===0 && (
            <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
          )}
          {!loading && alerts.length===0 && (
            <div className="px-5 py-10 text-center">
              <Bell size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          )}
          <div className="space-y-0.5 p-3">
            {alerts.map(a => (
              <div key={a._id} className={`border-l-4 ${LEVEL_BORDER[a.level]||'border-l-gray-300'} bg-white rounded-r-lg p-3 hover:bg-gray-50 transition-colors`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Badge label={a.level||'info'} color={LEVEL_COLOR[a.level]||'gray'} size="sm" />
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{timeAgo(a.createdAt)}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 leading-snug">{a.heading}</h4>
                {a.body && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.body}</p>}
                {a.entity && <span className="inline-block mt-1 text-[10px] text-indigo-500 font-mono">{a.entity} {a.action}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
