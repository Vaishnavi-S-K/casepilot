import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PageShell, { AnimatedItem } from '../components/layout/PageShell';
import Badge from '../components/ui/Badge';
import { ShimmerCard } from '../components/ui/Shimmer';
import { calendarAPI } from '../api/client';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const KIND_COLOR = { hearing:'rose', filing:'emerald', task:'amber', document:'violet' };
const KIND_LABEL = { hearing:'Hearing', filing:'Filing', task:'Task Deadline', document:'Doc Due' };

export default function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()+1);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await calendarAPI.get(year, month);
        setEvents(res.data || res || []);
      } catch { toast.error('Failed to load calendar'); }
      finally { setLoading(false); }
    })();
  }, [year, month]);

  const prevMonth = () => { if (month===1) { setMonth(12); setYear(y=>y-1); } else setMonth(m=>m-1); setSelectedDay(1); };
  const nextMonth = () => { if (month===12) { setMonth(1); setYear(y=>y+1); } else setMonth(m=>m+1); setSelectedDay(1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()+1); setSelectedDay(today.getDate()); };

  /* build calendar grid */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month-1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i=0; i<firstDay; i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  /* events for a specific day */
  const eventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.date && e.date.slice(0,10)===dateStr);
  };

  const selectedEvents = eventsForDay(selectedDay);
  const totalEvents = events.length;
  const isToday = (d) => d===today.getDate() && month===today.getMonth()+1 && year===today.getFullYear();

  return (
    <PageShell>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-heading font-extrabold text-gray-900">Calendar</h1>
          <button onClick={goToday} className="btn-ghost text-sm">Today</button>
        </div>
      </AnimatedItem>

      {/* Empty month alert */}
      {!loading && totalEvents === 0 && (
        <AnimatedItem>
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <p className="text-sm text-amber-700">No events this month. <button onClick={() => window.location.href = '/'} className="font-semibold underline hover:text-amber-900">Seed demo data</button> from the Dashboard to populate the calendar.</p>
          </div>
        </AnimatedItem>
      )}

      {loading ? <div className="grid grid-cols-2 gap-4"><ShimmerCard /><ShimmerCard /></div> : (
        <AnimatedItem>
          <div className="flex gap-6 flex-col lg:flex-row">
            {/* Calendar Grid — 65% */}
            <div className="lg:w-[65%] card p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft size={18} /></button>
                <h2 className="text-lg font-heading font-bold text-gray-800">{MONTHS[month-1]} {year}</h2>
                <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
                {DAYS.map(d => (
                  <div key={d} className="bg-gray-50 text-center py-2 text-xs font-semibold text-gray-500">{d}</div>
                ))}
                {calendarDays.map((day,i) => {
                  const dayEvents = eventsForDay(day);
                  const isSelected = day===selectedDay;
                  return (
                    <div
                      key={i}
                      onClick={()=>day&&setSelectedDay(day)}
                      className={`bg-white min-h-[72px] p-1.5 cursor-pointer transition-colors ${day?'hover:bg-indigo-50/50':''} ${isSelected?'ring-2 ring-indigo-500 ring-inset':''}`}
                    >
                      {day && (
                        <>
                          <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(day)?'bg-indigo-600 text-white':'text-gray-700'}`}>
                            {day}
                          </span>
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {dayEvents.slice(0,3).map((ev,j) => (
                              <span key={j} className={`w-1.5 h-1.5 rounded-full bg-${KIND_COLOR[ev.kind]||'gray'}-500`} title={ev.label} />
                            ))}
                            {dayEvents.length>3 && <span className="text-[8px] text-gray-400">+{dayEvents.length-3}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                {Object.entries(KIND_COLOR).map(([kind,color]) => (
                  <div key={kind} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full bg-${color}-500`} />
                    <span className="text-xs text-gray-500 capitalize">{KIND_LABEL[kind]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Detail — 35% */}
            <div className="lg:w-[35%] card p-5">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Events on</h3>
              <h2 className="text-lg font-heading font-bold text-gray-800 mb-4">
                {MONTHS[month-1]} {selectedDay}, {year}
              </h2>
              {selectedEvents.length===0 ? (
                <p className="text-sm text-gray-400 italic">No events for this day.</p>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto">
                  {selectedEvents.map((ev,i) => (
                    <div key={i} className={`border-l-4 border-${KIND_COLOR[ev.kind]||'gray'}-400 bg-${KIND_COLOR[ev.kind]||'gray'}-50 rounded-r-lg p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge label={KIND_LABEL[ev.kind]||ev.kind} color={KIND_COLOR[ev.kind]||'gray'} size="sm" />
                        {ev.status && <Badge label={ev.status} color="gray" size="sm" />}
                      </div>
                      <p className="text-sm font-medium text-gray-800 leading-snug">{ev.label}</p>
                      {ev.caseRef && <p className="text-[10px] font-mono text-gray-400 mt-0.5">{ev.caseRef}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </AnimatedItem>
      )}
    </PageShell>
  );
}
