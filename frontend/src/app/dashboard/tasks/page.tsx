'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksAPI, projectsAPI, authAPI } from '@/services/api';
import { Task } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  CheckSquare, Plus, Search, Clock, AlertTriangle, CheckCircle2,
  Circle, RefreshCw, Calendar, User, X, Loader2, Flag
} from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending:     { label: 'To Do',       color: 'text-slate-500',  icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-500',   icon: RefreshCw },
  review:      { label: 'In Review',   color: 'text-yellow-500', icon: Clock },
  completed:   { label: 'Done',        color: 'text-green-500',  icon: CheckCircle2 },
  blocked:     { label: 'Blocked',     color: 'text-red-500',    icon: AlertTriangle },
};

const priorityConfig: Record<string, { color: string; dot: string }> = {
  low:      { color: 'badge-gray',    dot: 'bg-slate-400' },
  medium:   { color: 'badge-warning', dot: 'bg-amber-400' },
  high:     { color: 'badge-error',   dot: 'bg-orange-500' },
  critical: { color: 'badge-error',   dot: 'bg-red-600' },
};

// ── New Task Modal ───────────────────────────────────────────────
function NewTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', status: 'pending', priority: 'medium',
    project: '', assigned_to: '', due_date: '', estimated_hours: '',
    tags: '',
  });
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-task'],
    queryFn: () => projectsAPI.getAll({}),
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-task'],
    queryFn: () => authAPI.getUsers(),
    enabled: open,
  });

  const projects = projectsData?.data?.results || projectsData?.data || [];
  const users = usersData?.data?.results || usersData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: object) => tasksAPI.create(data),
    onSuccess: () => {
      toast.success('Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
      setForm({ title: '', description: '', status: 'pending', priority: 'medium', project: '', assigned_to: '', due_date: '', estimated_hours: '', tags: '' });
      setChecklistItems(['']);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create task');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload: any = { ...form };
    if (!payload.project) delete payload.project;
    if (!payload.assigned_to) delete payload.assigned_to;
    if (!payload.due_date) delete payload.due_date;
    if (!payload.estimated_hours) delete payload.estimated_hours;
    if (payload.tags) payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    else delete payload.tags;

    const checklist = checklistItems.filter((c) => c.trim()).map((c) => ({ text: c.trim(), completed: false }));
    if (checklist.length > 0) payload.checklist = checklist;

    createMutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">New Task</h2>
                <p className="text-xs text-dark-400">Fill in the details to create a task</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Design homepage wireframe"
                className="input w-full"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the task in detail..."
                className="input w-full h-20 resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                  <option value="pending">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Project & Assignee */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Project</label>
                <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="input w-full">
                  <option value="">No Project</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Assign To</label>
                <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} className="input w-full">
                  <option value="">Unassigned</option>
                  {users.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.full_name || `${u.first_name} ${u.last_name}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date & Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Due Date</label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Estimated Hours</label>
                <input type="number" min="0" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} placeholder="0.0" className="input w-full" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="design, frontend, urgent (comma separated)"
                className="input w-full"
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Checklist</label>
              <div className="space-y-2">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...checklistItems];
                        updated[idx] = e.target.value;
                        setChecklistItems(updated);
                      }}
                      placeholder={`Checklist item ${idx + 1}`}
                      className="input flex-1"
                    />
                    {checklistItems.length > 1 && (
                      <button type="button" onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setChecklistItems([...checklistItems, ''])} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Add checklist item
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Task</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Task Row ─────────────────────────────────────────────────────
function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange: (id: string, status: string) => void }) {
  const StatusIcon = statusConfig[task.status]?.icon || Circle;
  return (
    <motion.div
      className={cn('card p-4 flex items-start gap-3', task.is_overdue && task.status !== 'completed' && 'border-l-4 border-red-400')}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button onClick={() => onStatusChange(task.id, task.status)} className="mt-0.5 flex-shrink-0">
        <StatusIcon className={cn('w-5 h-5 transition-colors', statusConfig[task.status]?.color)} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn('font-medium text-sm', task.status === 'completed' ? 'line-through text-dark-400' : 'text-dark-900 dark:text-white')}>
            {task.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={cn('badge text-xs', priorityConfig[task.priority]?.color || 'badge-gray')}>
              <div className={cn('w-1.5 h-1.5 rounded-full', priorityConfig[task.priority]?.dot)} />
              {task.priority}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-400">
          {task.assigned_to_name && (
            <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assigned_to_name}</span>
          )}
          {task.due_date && (
            <span className={cn('flex items-center gap-1', task.is_overdue && task.status !== 'completed' ? 'text-red-500 font-medium' : '')}>
              <Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString()}
              {task.is_overdue && task.status !== 'completed' && ' (Overdue)'}
            </span>
          )}
          {task.checklist.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3" />{task.checklist_progress}%
            </span>
          )}
          {task.subtask_count > 0 && <span>{task.subtask_count} subtasks</span>}
          {task.comments.length > 0 && <span>{task.comments.length} comments</span>}
          {task.tags?.length > 0 && (
            <div className="flex gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {task.checklist.length > 0 && (
          <div className="mt-2 h-1 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${task.checklist_progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', search, statusFilter, priorityFilter],
    queryFn: () => tasksAPI.getAll({ search, status: statusFilter || undefined, priority: priorityFilter || undefined }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tasksAPI.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Failed to update task'),
  });

  const allTasks: Task[] = data?.data?.results || data?.data || [];
  const tasks = showOverdue ? allTasks.filter((t) => t.is_overdue && t.status !== 'completed') : allTasks;

  const totalByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = allTasks.filter((t) => t.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">Manage and track all work tasks</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                statusFilter === status
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 hover:border-dark-300 bg-white dark:bg-dark-800'
              )}
            >
              <Icon className={cn('w-4 h-4', statusFilter === status ? 'text-white' : config.color)} />
              {config.label}
              <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold',
                statusFilter === status ? 'bg-white/20 text-white' : 'bg-dark-100 dark:bg-dark-700 text-dark-500'
              )}>
                {totalByStatus[status] || 0}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setShowOverdue(!showOverdue)}
          className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all',
            showOverdue ? 'bg-red-600 text-white border-red-600' : 'border-dark-200 dark:border-dark-600 text-dark-600 dark:text-dark-300 bg-white dark:bg-dark-800'
          )}
        >
          <AlertTriangle className="w-4 h-4" /> Overdue
          <span className={cn('ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold',
            showOverdue ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
          )}>
            {allTasks.filter((t) => t.is_overdue && t.status !== 'completed').length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input w-auto min-w-[140px]">
          <option value="">All Priority</option>
          {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <h3 className="font-medium text-dark-600 dark:text-dark-300">No tasks found</h3>
          <p className="text-dark-400 text-sm mt-1">Create your first task to get started</p>
          <button className="btn-primary mx-auto mt-4" onClick={() => setShowNewModal(true)}>
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onStatusChange={(id, currentStatus) =>
                updateMutation.mutate({ id, status: currentStatus === 'completed' ? 'pending' : 'completed' })
              }
            />
          ))}
        </div>
      )}

      {/* New Task Modal */}
      <NewTaskModal open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}
