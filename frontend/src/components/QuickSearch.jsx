import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Briefcase, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import { searchAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';
import useDebounce from '../hooks/useDebounce';

const ICON_MAP = { cases: Briefcase, clients: Users, documents: FileText, tasks: CheckCircle };
const ROUTE_MAP = { cases: '/cases', clients: '/clients', documents: '/documents', tasks: '/tasks' };

export default function QuickSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cp-recent-search')||'[]'); } catch { return []; }
  });
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef();
  const navigate = useNavigate();

  useEffect(() => { if (isOpen) { setQuery(''); setResults({}); setActiveIdx(-1); setTimeout(()=>inputRef.current?.focus(),100); } }, [isOpen]);

  const doSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setResults({}); return; }
    try {
      setLoading(true);
      const res = await searchAPI.query(debouncedQuery);
      setResults(res.data || res || {});
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [debouncedQuery]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const allItems = [];
  Object.entries(results).forEach(([group, items]) => {
    (items||[]).forEach(item => allItems.push({ group, item }));
  });

  const handleSelect = (group, item) => {
    /* Save to recent */
    const label = item.title || item.fullName || item.name || item.ref || '';
    const entry = { label, group, id: item._id };
    const updated = [entry, ...recent.filter(r=> r.id!==item._id)].slice(0,8);
    setRecent(updated);
    localStorage.setItem('cp-recent-search', JSON.stringify(updated));

    /* Navigate */
    if (group==='cases' && item._id) navigate(`/cases/${item._id}`);
    else navigate(ROUTE_MAP[group]||'/dashboard');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key==='Escape') { onClose(); return; }
    if (e.key==='ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i+1, allItems.length-1)); }
    if (e.key==='ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i-1, -1)); }
    if (e.key==='Enter' && activeIdx>=0 && allItems[activeIdx]) {
      const { group, item } = allItems[activeIdx];
      handleSelect(group, item);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/60 overflow-hidden z-10">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search size={20} className="text-indigo-500" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base"
            placeholder="Search cases, clients, documents, tasks…"
            value={query} onChange={e=>setQuery(e.target.value)}
          />
          <kbd className="hidden sm:inline text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">ESC</kbd>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && <div className="px-5 py-6 text-center text-sm text-gray-400">Searching…</div>}

          {!loading && debouncedQuery.length >= 2 && allItems.length === 0 && (
            <div className="px-5 py-6 text-center text-sm text-gray-400">No results for "{debouncedQuery}"</div>
          )}

          {!loading && allItems.length > 0 && (
            <div className="py-2">
              {Object.entries(results).map(([group, items]) => {
                if (!items?.length) return null;
                const Icon = ICON_MAP[group] || Briefcase;
                return (
                  <div key={group}>
                    <div className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group}</div>
                    {items.map((item, i) => {
                      const globalIdx = allItems.findIndex(a => a.item._id===item._id && a.group===group);
                      const label = item.title || item.fullName || item.name || item.ref || 'Untitled';
                      const sub = item.ref || item.email || item.docType || item.stage || '';
                      return (
                        <button
                          key={item._id||i}
                          onClick={()=>handleSelect(group, item)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-indigo-50 transition-colors ${globalIdx===activeIdx?'bg-indigo-50':''}`}
                        >
                          <Icon size={16} className="text-indigo-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{label}</p>
                            {sub && <p className="text-[10px] text-gray-400 truncate">{sub}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Recent searches (when no query) */}
          {!debouncedQuery && recent.length > 0 && (
            <div className="py-2">
              <div className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> Recent</div>
              {recent.map((r, i) => {
                const Icon = ICON_MAP[r.group] || Briefcase;
                return (
                  <button
                    key={i}
                    onClick={()=>{ navigate(ROUTE_MAP[r.group]||'/dashboard'); onClose(); }}
                    className="w-full flex items-center gap-3 px-5 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <Icon size={14} className="text-gray-300" />
                    <span className="text-sm text-gray-600">{r.label}</span>
                    <span className="text-[9px] text-gray-300 ml-auto capitalize">{r.group}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
