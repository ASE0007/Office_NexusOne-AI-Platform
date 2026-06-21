'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarAPI } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin,
  Link2, X, Loader2, CalendarCheck, Users, Video, Flag,
  Bell, Tag, RefreshCw
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  meeting_link?: string;
  is_all_day: boolean;
  color?: string;
  project?: string;
  project_title?: string;
  customer?: string;
  customer_name?: string;
  attendees?: string[];
  reminder_minutes?: number;
}

const EVENT_COLORS: Record<string, string> = {
  meeting: 'bg-blue-500',
  deadline: 'bg-red-500',
  reminder: 'bg-yellow-500',
  holiday: 'bg-green-500',
  task: 'bg-purple-500',
  other: 'bg-gray-500',
};

const EVENT_TYPE_CONFIG = [
  { value: 'meeting', label: 'Meeting', color: 'text-blue-600' },
  { value: 'deadline', label: 'Deadline', color: 'text-red-600' },
  { value: 'reminder', label: 'Reminder', color: 'text-yellow-600' },
  { value: 'holiday', label: 'Holiday', color: 'text-green-600' },
  { value: 'task', label: 'Task', color: 'text-purple-600' },
  { value: 'other', label: 'Other', color: 'text-gray-600' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Add Event Modal ───────────────────────────────────────────────
function AddEventModal({ open, onClose, defaultDate }: { open: boolean; onClose: () => void; defaultDate?: string }) {
  const queryClient = useQueryClient();
  const today = defaultDate || new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'meeting',
    start_date: today, start_time: '09:00',
    end_date: today, end_time: '10:00',
    location: '', meeting_link: '', is_all_day: false,
    reminder_minutes: '30',
  });

  const mutation = useMutation({
    mutationFn: (data: object) => calendarAPI.createEvent(data),
    onSuccess: () => {
      toast.success('Event created!');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onClose();
      setForm({ title: '', description: '', event_type: 'meeting', start_date: today, start_time: '09:00', end_date: today, end_time: '10:00', location: '', meeting_link: '', is_all_day: false, reminder_minutes: '30' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create event'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload: any = {
      title: form.title,
      description: form.description,
      event_type: form.event_type,
      is_all_day: form.is_all_day,
      location: form.location,
      meeting_link: form.meeting_link,
      reminder_minutes: form.reminder_minutes ? Number(form.reminder_minutes) : null,
      start_datetime: form.is_all_day ? `${form.start_date}T00:00:00` : `${form.start_date}T${form.start_time}:00`,
      end_datetime: form.is_all_day ? `${form.end_date}T23:59:59` : `${form.end_date}T${form.end_time}:00`,
    };
    if (!payload.location) delete payload.location;
    if (!payload.meeting_link) delete payload.meeting_link;
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-primary-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">New Event</h2><p className="text-xs text-dark-400">Add to your calendar</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Event Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Team Meeting, Project Deadline" className="input w-full" required />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_CONFIG.map((t) => (
                  <button key={t.value} type="button" onClick={() => setForm({ ...form, event_type: t.value })}
                    className={cn('px-3 py-1.5 rounded-lg text-sm font-medium border transition-all', form.event_type === t.value ? 'bg-primary-600 text-white border-primary-600' : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:border-dark-300')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* All day toggle */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, is_all_day: !form.is_all_day })}
                className={cn('relative w-10 h-5 rounded-full transition-colors', form.is_all_day ? 'bg-primary-600' : 'bg-dark-200 dark:bg-dark-600')}>
                <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.is_all_day ? 'left-5.5 translate-x-0.5' : 'left-0.5')} />
              </button>
              <span className="text-sm text-dark-700 dark:text-dark-300">All Day Event</span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">End Date</label>
                <input type="date" value={form.end_date} min={form.start_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input w-full" />
              </div>
            </div>

            {!form.is_all_day && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Start Time</label>
                  <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">End Time</label>
                  <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="input w-full" />
                </div>
              </div>
            )}

            {/* Location & Meeting Link */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5"><MapPin className="w-3.5 h-3.5 inline mr-1" />Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Office, Room 101, Online..." className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5"><Video className="w-3.5 h-3.5 inline mr-1" />Meeting Link</label>
              <input type="url" value={form.meeting_link} onChange={(e) => setForm({ ...form, meeting_link: e.target.value })} placeholder="https://zoom.us/j/... or Google Meet link" className="input w-full" />
            </div>

            {/* Reminder */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5"><Bell className="w-3.5 h-3.5 inline mr-1" />Reminder</label>
              <select value={form.reminder_minutes} onChange={(e) => setForm({ ...form, reminder_minutes: e.target.value })} className="input w-full">
                <option value="">No reminder</option>
                <option value="5">5 minutes before</option>
                <option value="10">10 minutes before</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full h-16 resize-none" placeholder="Event details, agenda, notes..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Event</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Event Detail Popup ────────────────────────────────────────────
function EventPopup({ event, onClose, onDelete }: { event: CalendarEvent; onClose: () => void; onDelete: (id: string) => void }) {
  const typeConfig = EVENT_TYPE_CONFIG.find(t => t.value === event.event_type);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl p-5" initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', EVENT_COLORS[event.event_type] || 'bg-gray-500')} />
            <span className={cn('text-xs font-semibold uppercase tracking-wide', typeConfig?.color)}>{event.event_type}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-4 h-4 text-dark-400" /></button>
        </div>
        <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-3">{event.title}</h3>
        <div className="space-y-2 text-sm text-dark-500">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" />
            <span>{event.is_all_day ? 'All Day' : `${new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(event.end_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</span>
          </div>
          {event.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>{event.location}</span></div>}
          {event.meeting_link && <div className="flex items-center gap-2"><Video className="w-4 h-4" /><a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">Join Meeting</a></div>}
          {event.customer_name && <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{event.customer_name}</span></div>}
          {event.project_title && <div className="flex items-center gap-2"><Link2 className="w-4 h-4" /><span>{event.project_title}</span></div>}
          {event.description && <p className="mt-2 pt-2 border-t border-dark-100 dark:border-dark-700 text-dark-600 dark:text-dark-300">{event.description}</p>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => { onDelete(event.id); onClose(); }} className="btn btn-sm btn-outline text-red-500 border-red-300 hover:bg-red-50">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Calendar Grid ─────────────────────────────────────────────────
function CalendarGrid({ year, month, events, onDayClick, onEventClick }: {
  year: number; month: number; events: CalendarEvent[]; onDayClick: (date: string) => void; onEventClick: (e: CalendarEvent) => void;
}) {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [year, month, firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.start_datetime.startsWith(dateStr));
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-dark-100 dark:border-dark-700">
        {DAYS.map(d => <div key={d} className="py-3 text-center text-xs font-semibold text-dark-400 uppercase tracking-wide">{d}</div>)}
      </div>
      {/* Grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-dark-50 dark:border-dark-800/50 bg-dark-50/30 dark:bg-dark-800/20" />;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const dayEvents = getEventsForDay(day);
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return (
            <div key={day} onClick={() => onDayClick(dateStr)} className="min-h-[100px] border-b border-r border-dark-100 dark:border-dark-700/50 p-1 cursor-pointer hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors group">
              <div className={cn('w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 mx-auto transition-colors',
                isToday ? 'bg-primary-600 text-white' : 'text-dark-700 dark:text-dark-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30')}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => (
                  <div key={e.id} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className={cn('text-xs text-white rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80', EVENT_COLORS[e.event_type] || 'bg-gray-500')}>
                    {e.is_all_day ? '● ' : `${new Date(e.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `}{e.title}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-xs text-dark-400 px-1">+{dayEvents.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Today's Schedule Sidebar ──────────────────────────────────────
function TodaySchedule({ events, onEventClick }: { events: CalendarEvent[]; onEventClick: (e: CalendarEvent) => void }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.start_datetime.startsWith(todayStr)).sort((a, b) => a.start_datetime.localeCompare(b.start_datetime));
  const upcomingEvents = events.filter(e => e.start_datetime > new Date().toISOString()).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h3 className="font-semibold text-dark-900 dark:text-white text-sm mb-3">Today's Schedule</h3>
        {todayEvents.length === 0 ? (
          <div className="text-center py-4 text-dark-400 text-xs"><CalendarCheck className="w-8 h-8 mx-auto mb-2 text-dark-300" />No events today</div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map(e => (
              <div key={e.id} onClick={() => onEventClick(e)} className="flex items-start gap-2 p-2 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 cursor-pointer transition-colors">
                <div className={cn('w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0', EVENT_COLORS[e.event_type] || 'bg-gray-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-800 dark:text-dark-200 truncate">{e.title}</p>
                  <p className="text-xs text-dark-400">{e.is_all_day ? 'All day' : new Date(e.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-dark-900 dark:text-white text-sm mb-3">Upcoming</h3>
          <div className="space-y-2">
            {upcomingEvents.map(e => (
              <div key={e.id} onClick={() => onEventClick(e)} className="flex items-start gap-2 p-2 rounded-lg hover:bg-dark-50 dark:hover:bg-dark-800 cursor-pointer transition-colors">
                <div className={cn('w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0', EVENT_COLORS[e.event_type] || 'bg-gray-500')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark-800 dark:text-dark-200 truncate">{e.title}</p>
                  <p className="text-xs text-dark-400">{new Date(e.start_datetime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="card p-4">
        <h3 className="font-semibold text-dark-900 dark:text-white text-sm mb-3">Event Types</h3>
        <div className="space-y-1.5">
          {EVENT_TYPE_CONFIG.map(t => (
            <div key={t.value} className="flex items-center gap-2">
              <div className={cn('w-2.5 h-2.5 rounded-full', EVENT_COLORS[t.value])} />
              <span className="text-xs text-dark-500 capitalize">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Page ────────────────────────────────────────────
export default function CalendarPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedDate, setClickedDate] = useState<string | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar-events', currentYear, currentMonth],
    queryFn: () => calendarAPI.getEvents({
      month: currentMonth + 1,
      year: currentYear,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarAPI.deleteEvent(id),
    onSuccess: () => { toast.success('Event deleted'); queryClient.invalidateQueries({ queryKey: ['calendar-events'] }); },
    onError: () => toast.error('Failed to delete event'),
  });

  const events: CalendarEvent[] = data?.data?.results || data?.data || [];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const handleDayClick = (date: string) => { setClickedDate(date); setShowAddModal(true); };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Calendar</h1><p className="page-subtitle">Schedule meetings, deadlines, and events</p></div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary" disabled={isLoading}><RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} /></button>
          <button onClick={() => { setClickedDate(undefined); setShowAddModal(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New Event</button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Calendar */}
        <div className="flex-1">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"><ChevronLeft className="w-5 h-5 text-dark-400" /></button>
              <h2 className="text-xl font-bold text-dark-900 dark:text-white">{MONTHS[currentMonth]} {currentYear}</h2>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors"><ChevronRight className="w-5 h-5 text-dark-400" /></button>
            </div>
            <button onClick={goToday} className="btn-secondary text-sm">Today</button>
          </div>

          {isLoading ? (
            <div className="card p-12 text-center text-dark-400">Loading calendar...</div>
          ) : (
            <CalendarGrid year={currentYear} month={currentMonth} events={events} onDayClick={handleDayClick} onEventClick={setSelectedEvent} />
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <TodaySchedule events={events} onEventClick={setSelectedEvent} />
        </div>
      </div>

      {/* Modals */}
      <AddEventModal open={showAddModal} onClose={() => { setShowAddModal(false); setClickedDate(undefined); }} defaultDate={clickedDate} />
      <AnimatePresence>
        {selectedEvent && <EventPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} onDelete={(id) => deleteMutation.mutate(id)} />}
      </AnimatePresence>
    </div>
  );
}
