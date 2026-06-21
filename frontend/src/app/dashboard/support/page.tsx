'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportAPI, crmAPI } from '@/services/api';
import { Ticket } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  Headphones, Plus, Search, AlertTriangle, CheckCircle, Clock,
  Bot, MessageSquare, User, Tag, AlertCircle, ChevronRight,
  RefreshCw, Send, X, Loader2
} from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'badge-error', pending: 'badge-warning', in_progress: 'badge-primary',
  resolved: 'badge-success', closed: 'badge-gray', escalated: 'badge-error',
};
const priorityDot: Record<string, string> = {
  low: 'bg-slate-400', medium: 'bg-amber-400', high: 'bg-orange-500', critical: 'bg-red-500',
};

// ── New Ticket Modal ──────────────────────────────────────────────
function NewTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', category: '', customer: '',
  });

  const { data: customersData } = useQuery({ queryKey: ['customers-support'], queryFn: () => crmAPI.getCustomers(), enabled: open });
  const { data: categoriesData } = useQuery({ queryKey: ['support-categories'], queryFn: () => supportAPI.getCategories(), enabled: open });
  const customers = customersData?.data?.results || customersData?.data || [];
  const categories = categoriesData?.data?.results || categoriesData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: object) => supportAPI.createTicket(data),
    onSuccess: () => {
      toast.success('Support ticket created!');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      onClose();
      setForm({ title: '', description: '', priority: 'medium', category: '', customer: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create ticket'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    const payload: any = { ...form };
    if (!payload.customer) delete payload.customer;
    if (!payload.category) delete payload.category;
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
              <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><Headphones className="w-5 h-5 text-red-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">New Support Ticket</h2><p className="text-xs text-dark-400">Create a new support request</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" className="input w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..." className="input w-full h-28 resize-none" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input w-full">
                  <option value="">General</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Customer</label>
              <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input w-full">
                <option value="">Internal / No Customer</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.full_name} {c.company_name ? `— ${c.company_name}` : ''}</option>)}
              </select>
            </div>
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300">
              ⚡ An auto ticket number will be assigned (e.g. TKT-0001). AI summary will be generated automatically.
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Ticket</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Ticket Detail Panel ───────────────────────────────────────────
function TicketDetail({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const { data: repliesData } = useQuery({ queryKey: ['replies', ticket.id], queryFn: () => supportAPI.getReplies(ticket.id) });
  const replies = repliesData?.data?.results || repliesData?.data || [];

  const aiMutation = useMutation({
    mutationFn: () => supportAPI.getAISummary(ticket.id),
    onSuccess: () => { toast.success('AI summary generated!'); queryClient.invalidateQueries({ queryKey: ['tickets'] }); },
    onError: () => toast.error('AI summary failed'),
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => supportAPI.addReply(ticket.id, { content }),
    onSuccess: () => { toast.success('Reply sent!'); setReply(''); queryClient.invalidateQueries({ queryKey: ['replies', ticket.id] }); },
    onError: () => toast.error('Failed to send reply'),
  });

  return (
    <motion.div className="card p-5" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-dark-400">#{ticket.ticket_number}</span>
            <span className={cn('badge text-xs', statusColors[ticket.status] || 'badge-gray')}>{ticket.status.replace('_', ' ')}</span>
            {ticket.is_sla_breached && <span className="badge badge-error text-xs">SLA Breach!</span>}
          </div>
          <h2 className="text-base font-bold text-dark-900 dark:text-white">{ticket.title}</h2>
          <p className="text-sm text-dark-500 mt-1">{ticket.description}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700 flex-shrink-0"><X className="w-4 h-4 text-dark-400" /></button>
      </div>

      {/* AI Summary */}
      {ticket.ai_summary && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-1"><Bot className="w-3.5 h-3.5" /> AI Summary</div>
          <p className="text-xs text-purple-600 dark:text-purple-400">{ticket.ai_summary}</p>
        </div>
      )}
      {ticket.ai_suggested_reply && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs font-semibold"><Bot className="w-3.5 h-3.5" /> AI Suggested Reply</div>
            <button onClick={() => setReply(ticket.ai_suggested_reply || '')} className="text-xs text-primary-600 font-medium">Use this</button>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">{ticket.ai_suggested_reply}</p>
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto">
          {replies.map((r: any) => (
            <div key={r.id} className={cn('p-3 rounded-xl text-sm', r.is_internal ? 'bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800' : 'bg-dark-50 dark:bg-dark-800')}>
              <div className="flex items-center gap-2 mb-1 text-xs text-dark-400"><User className="w-3 h-3" />{r.user_name} {r.is_internal && <span className="text-yellow-600 font-medium">(Internal)</span>}</div>
              <p className="text-dark-700 dark:text-dark-300">{r.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Box */}
      <div className="flex gap-2">
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="input flex-1 h-16 resize-none text-sm" />
        <div className="flex flex-col gap-2">
          <button onClick={() => aiMutation.mutate()} disabled={aiMutation.isPending} className="btn-secondary btn-sm text-xs"><Bot className="w-3.5 h-3.5" /> AI</button>
          <button onClick={() => replyMutation.mutate(reply)} disabled={!reply.trim() || replyMutation.isPending} className="btn-primary px-4 self-end text-sm">
            {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Ticket Row ────────────────────────────────────────────────────
function TicketRow({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  return (
    <motion.tr className="cursor-pointer" onClick={onClick} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', priorityDot[ticket.priority])} />
          <div>
            <div className="font-medium text-dark-900 dark:text-white text-sm line-clamp-1">{ticket.title}</div>
            <div className="text-xs text-dark-400">#{ticket.ticket_number}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={cn('badge text-xs', statusColors[ticket.status] || 'badge-gray')}>{ticket.status.replace('_', ' ')}</span>
        {ticket.is_sla_breached && <span className="ml-1 badge badge-error text-xs">SLA!</span>}
      </td>
      <td className="px-4 py-3 text-sm text-dark-500">{ticket.customer_name || 'N/A'}</td>
      <td className="px-4 py-3 text-sm text-dark-500">{ticket.assigned_to_name || 'Unassigned'}</td>
      <td className="px-4 py-3 text-sm text-dark-400">{ticket.reply_count} replies</td>
      <td className="px-4 py-3 text-sm text-dark-400">{new Date(ticket.created_at).toLocaleDateString()}</td>
      <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-dark-300" /></td>
    </motion.tr>
  );
}

// ── Main Support Page ─────────────────────────────────────────────
export default function SupportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', search, statusFilter, priorityFilter],
    queryFn: () => supportAPI.getTickets({ search, status: statusFilter || undefined, priority: priorityFilter || undefined }),
  });
  const { data: statsData } = useQuery({ queryKey: ['support-stats'], queryFn: supportAPI.getStats });

  const tickets: Ticket[] = data?.data?.results || data?.data || [];
  const stats = statsData?.data || {};

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Support Tickets</h1><p className="page-subtitle">Manage customer support requests</p></div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-secondary"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowNewModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Ticket</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: stats.total || 0, color: 'text-dark-700 dark:text-dark-200' },
          { label: 'Open', value: stats.open || 0, color: 'text-red-600' },
          { label: 'In Progress', value: stats.in_progress || 0, color: 'text-blue-600' },
          { label: 'Resolved', value: stats.resolved || 0, color: 'text-green-600' },
          { label: 'Escalated', value: stats.escalated || 0, color: 'text-orange-600' },
          { label: 'SLA Breached', value: stats.sla_breached || 0, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-dark-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {selectedTicket && <TicketDetail ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" /><input type="text" placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[130px]">
          <option value="">All Status</option>
          {['open', 'pending', 'in_progress', 'resolved', 'closed', 'escalated'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input w-auto min-w-[130px]">
          <option value="">All Priority</option>
          {['low', 'medium', 'high', 'critical'].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="p-8 text-center text-dark-400">Loading tickets...</div>
        ) : (
          <table className="table">
            <thead><tr><th>Ticket</th><th>Status</th><th>Customer</th><th>Assigned To</th><th>Replies</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {tickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} onClick={() => setSelectedTicket(ticket)} />)}
              {tickets.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">
                  No tickets found. <button className="text-primary-500 underline ml-1" onClick={() => setShowNewModal(true)}>Create one?</button>
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <NewTicketModal open={showNewModal} onClose={() => setShowNewModal(false)} />
    </div>
  );
}
