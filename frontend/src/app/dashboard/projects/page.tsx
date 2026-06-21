'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, crmAPI, authAPI } from '@/services/api';
import { Project, Task, TaskStatus } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  FolderKanban, Plus, Search, Calendar, Users, DollarSign,
  TrendingUp, AlertTriangle, CheckCircle2, Clock, LayoutGrid,
  List, MoreHorizontal, Zap, Target, X, Loader2
} from 'lucide-react';

const statusColors: Record<string, string> = {
  planning: 'badge-gray', active: 'badge-success', on_hold: 'badge-warning',
  completed: 'badge-primary', cancelled: 'badge-error', archived: 'badge-gray',
};

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600', medium: 'bg-amber-100 text-amber-600',
  high: 'bg-orange-100 text-orange-600', critical: 'bg-red-100 text-red-600',
};

const kanbanColumns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'To Do', color: 'border-slate-300' },
  { id: 'in_progress', label: 'In Progress', color: 'border-blue-400' },
  { id: 'review', label: 'Review', color: 'border-yellow-400' },
  { id: 'completed', label: 'Done', color: 'border-green-400' },
  { id: 'blocked', label: 'Blocked', color: 'border-red-400' },
];

// ── New Project Modal ────────────────────────────────────────────
function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', status: 'planning', priority: 'medium',
    start_date: '', deadline: '', budget: '', client: '', manager: '',
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-for-project'],
    queryFn: () => crmAPI.getCustomers(),
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-project'],
    queryFn: () => authAPI.getUsers(),
    enabled: open,
  });

  const customers = customersData?.data?.results || customersData?.data || [];
  const users = usersData?.data?.results || usersData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: object) => projectsAPI.create(data),
    onSuccess: () => {
      toast.success('Project created successfully!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-stats'] });
      onClose();
      setForm({ title: '', description: '', status: 'planning', priority: 'medium', start_date: '', deadline: '', budget: '', client: '', manager: '' });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to create project');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload: any = { ...form };
    if (!payload.budget) delete payload.budget;
    if (!payload.client) delete payload.client;
    if (!payload.manager) delete payload.manager;
    if (!payload.start_date) delete payload.start_date;
    if (!payload.deadline) delete payload.deadline;
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
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">New Project</h2>
                <p className="text-xs text-dark-400">Fill in the details to create a project</p>
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
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Website Redesign Q3"
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
                placeholder="Brief description of the project..."
                className="input w-full h-20 resize-none"
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
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

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Start Date</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input w-full" />
              </div>
            </div>

            {/* Budget & Client */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Budget ($)</label>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Client (CRM)</label>
                <select value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="input w-full">
                  <option value="">No Client</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.full_name || `${c.first_name} ${c.last_name}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Project Manager</label>
              <select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} className="input w-full">
                <option value="">Assign Manager</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.full_name || `${u.first_name} ${u.last_name}`} — {u.role}</option>
                ))}
              </select>
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Project</>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Project Card ─────────────────────────────────────────────────
function ProjectCard({ project }: { project: Project }) {
  const daysLeft = project.deadline
    ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      className="card-hover p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-dark-900 dark:text-white text-sm line-clamp-1">{project.title}</h3>
          <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{project.description}</p>
        </div>
        <div className="flex flex-col gap-1 ml-2 items-end">
          <span className={cn('badge text-xs', statusColors[project.status] || 'badge-gray')}>
            {project.status.replace('_', ' ')}
          </span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityColors[project.priority])}>
            {project.priority}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-dark-500">Progress</span>
          <span className="font-medium text-dark-700 dark:text-dark-300">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', project.is_overdue ? 'bg-red-500' : 'bg-primary-500')}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 text-xs text-dark-500">
        {project.deadline && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className={cn(project.is_overdue ? 'text-red-500 font-medium' : '')}>
              {project.is_overdue ? 'Overdue' : daysLeft !== null ? `${daysLeft}d left` : '-'}
            </span>
          </div>
        )}
        {project.budget && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span>${Number(project.budget).toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          <span>{project.task_count} tasks</span>
        </div>
        {project.team_members.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{project.team_members.length} members</span>
          </div>
        )}
        {project.client_name && (
          <div className="flex items-center gap-1 col-span-2">
            <Users className="w-3 h-3 text-primary-400" />
            <span className="text-primary-500 font-medium">{project.client_name}</span>
          </div>
        )}
      </div>

      {/* Team avatars */}
      {project.team_members.length > 0 && (
        <div className="flex items-center gap-1 mt-3">
          {project.team_members.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 border-2 border-white dark:border-dark-800 flex items-center justify-center text-white text-xs font-bold -ml-1 first:ml-0"
              title={m.name}
            >
              {m.name[0]}
            </div>
          ))}
          {project.team_members.length > 4 && (
            <div className="w-7 h-7 rounded-full bg-dark-200 dark:bg-dark-700 border-2 border-white dark:border-dark-800 flex items-center justify-center text-xs text-dark-500 -ml-1">
              +{project.team_members.length - 4}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Kanban View ──────────────────────────────────────────────────
function KanbanView({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['kanban', projectId],
    queryFn: () => projectsAPI.getKanban(projectId),
  });

  const board = data?.data || {};

  if (isLoading) return <div className="text-center p-8 text-dark-400">Loading board...</div>;

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {kanbanColumns.map((col) => {
        const column = board[col.id] || { tasks: [], count: 0, label: col.label };
        return (
          <div key={col.id} className={cn('flex-shrink-0 w-72 bg-dark-50 dark:bg-dark-800/50 rounded-xl border-t-2', col.color)}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-dark-700 dark:text-dark-200">{col.label}</span>
                <span className="w-5 h-5 bg-dark-200 dark:bg-dark-600 rounded-full text-xs flex items-center justify-center font-medium text-dark-600 dark:text-dark-300">
                  {column.count}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {(column.tasks || []).map((task: Task) => (
                <motion.div
                  key={task.id}
                  className="bg-white dark:bg-dark-700 rounded-lg p-3 shadow-sm border border-dark-100 dark:border-dark-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-start gap-2">
                    <div className={cn('mt-0.5 w-2 h-2 rounded-full flex-shrink-0', {
                      'bg-slate-400': task.priority === 'low',
                      'bg-amber-400': task.priority === 'medium',
                      'bg-orange-500': task.priority === 'high',
                      'bg-red-500': task.priority === 'critical',
                    })} />
                    <p className="text-sm font-medium text-dark-800 dark:text-dark-100 line-clamp-2">{task.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {task.due_date && (
                      <div className={cn('flex items-center gap-1 text-xs', task.is_overdue ? 'text-red-500' : 'text-dark-400')}>
                        <Clock className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {task.assigned_to_name && (
                      <div className="ml-auto w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold" title={task.assigned_to_name}>
                        {task.assigned_to_name[0]}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {column.tasks?.length === 0 && (
                <div className="text-center py-8 text-dark-300 text-xs">No tasks</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function ProjectsPage() {
  const [view, setView] = useState<'grid' | 'kanban'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: () => projectsAPI.getAll({ search, status: statusFilter || undefined }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['project-stats'],
    queryFn: () => projectsAPI.getStats(),
  });

  const projects: Project[] = data?.data?.results || data?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track all your projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNewModal(true)}>
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total || 0, icon: FolderKanban, color: 'text-primary-600' },
          { label: 'Active', value: stats.active || 0, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Completed', value: stats.completed || 0, icon: CheckCircle2, color: 'text-blue-600' },
          { label: 'On Hold', value: stats.on_hold || 0, icon: Clock, color: 'text-yellow-600' },
          { label: 'Overdue', value: stats.overdue || 0, icon: AlertTriangle, color: 'text-red-600' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <Icon className={cn('w-5 h-5', s.color)} />
              <div>
                <div className="text-xl font-bold text-dark-900 dark:text-white">{s.value}</div>
                <div className="text-xs text-dark-400">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[140px]">
          <option value="">All Status</option>
          {['planning', 'active', 'on_hold', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <div className="flex gap-1 card p-1">
          <button onClick={() => { setView('grid'); setSelectedProjectId(null); }} className={cn('p-2 rounded-lg transition-all', view === 'grid' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-600')}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('kanban')} className={cn('p-2 rounded-lg transition-all', view === 'kanban' ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-600')}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban Project Selector */}
      {view === 'kanban' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-dark-500">Select project for Kanban:</span>
          <select value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(e.target.value)} className="input w-auto min-w-[200px]">
            <option value="">Choose a project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}

      {/* Content */}
      {view === 'grid' ? (
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="card p-12 text-center">
            <FolderKanban className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <h3 className="text-dark-600 font-medium mb-2">No projects found</h3>
            <p className="text-dark-400 text-sm mb-4">Create your first project to get started</p>
            <button className="btn-primary mx-auto" onClick={() => setShowNewModal(true)}>
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )
      ) : selectedProjectId ? (
        <KanbanView projectId={selectedProjectId} />
      ) : (
        <div className="card p-12 text-center text-dark-400">
          <Target className="w-12 h-12 mx-auto mb-3 text-dark-300" />
          <p>Select a project above to view its Kanban board</p>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}
