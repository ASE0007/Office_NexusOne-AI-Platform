'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmAPI, projectsAPI } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer, Lead } from '@/types';
import toast from 'react-hot-toast';
import {
  Users, Plus, Search, MoreHorizontal, Mail, Phone, Building2,
  Star, TrendingUp, UserPlus, Edit2, Trash2, ArrowUpRight,
  RefreshCw, X, Loader2, FolderKanban
} from 'lucide-react';
import { cn } from '@/utils/cn';

const statusColors: Record<string, string> = {
  active: 'badge-success', inactive: 'badge-gray',
  prospect: 'badge-primary', vip: 'badge-warning',
  new: 'badge-primary', contacted: 'badge-warning',
  qualified: 'badge-success', converted: 'badge-success', lost: 'badge-error',
};

// ── Add Customer Modal ───────────────────────────────────────────
function AddCustomerModal({ open, onClose, editData }: { open: boolean; onClose: () => void; editData?: Customer | null }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: editData?.first_name || '',
    last_name: editData?.last_name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    company_name: editData?.company_name || '',
    job_title: editData?.job_title || '',
    status: (editData?.status || 'prospect') as string,
    city: editData?.city || '',
    country: editData?.country || '',
    notes: editData?.notes || '',
    tags: editData?.tags?.join(', ') || '',
  });

  const mutation = useMutation({
    mutationFn: (data: object) =>
      editData ? crmAPI.updateCustomer(editData.id, data) : crmAPI.createCustomer(data),
    onSuccess: () => {
      toast.success(editData ? 'Customer updated!' : 'Customer added successfully!');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to save customer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) { toast.error('Name and Email are required'); return; }
    const payload: any = { ...form };
    if (payload.tags) payload.tags = payload.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    else delete payload.tags;
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="relative w-full max-w-xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">{editData ? 'Edit Customer' : 'Add Customer'}</h2>
                <p className="text-xs text-dark-400">Fill in customer details</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Last Name</label>
                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                  <option value="prospect">Prospect</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Company</label>
                <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Job Title</label>
                <input type="text" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">City</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Country</label>
                <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Tags</label>
              <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, enterprise, tech (comma separated)" className="input w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-20 resize-none" placeholder="Any additional notes..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> {editData ? 'Update' : 'Add Customer'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Add Lead Modal ───────────────────────────────────────────────
function AddLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company_name: '', status: 'new', priority: 'medium',
    source: '', expected_value: '', expected_close_date: '', notes: '',
  });

  const mutation = useMutation({
    mutationFn: (data: object) => crmAPI.createLead(data),
    onSuccess: () => {
      toast.success('Lead added successfully!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add lead'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) { toast.error('Name and Email are required'); return; }
    const payload: any = { ...form };
    if (!payload.expected_value) delete payload.expected_value;
    if (!payload.expected_close_date) delete payload.expected_close_date;
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="relative w-full max-w-xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Lead</h2>
                <p className="text-xs text-dark-400">Track a new potential customer</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">First Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Last Name</label>
                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Company</label>
                <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input w-full">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Expected Value ($)</label>
                <input type="number" min="0" step="0.01" value={form.expected_value} onChange={(e) => setForm({ ...form, expected_value: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Expected Close</label>
                <input type="date" value={form.expected_close_date} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })} className="input w-full" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="input w-full">
                <option value="">Select source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social_media">Social Media</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="cold_call">Cold Call</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-20 resize-none" placeholder="Any notes about this lead..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add Lead</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Add Project from CRM Modal ────────────────────────────────────
function AddProjectFromCRMModal({ open, onClose, customerId, customerName }: { open: boolean; onClose: () => void; customerId: string; customerName: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', status: 'planning', priority: 'medium',
    start_date: '', deadline: '', budget: '',
  });

  const mutation = useMutation({
    mutationFn: (data: object) => projectsAPI.create(data),
    onSuccess: () => {
      toast.success('Project created and linked to customer!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create project'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const payload: any = { ...form, client: customerId };
    if (!payload.budget) delete payload.budget;
    if (!payload.start_date) delete payload.start_date;
    if (!payload.deadline) delete payload.deadline;
    mutation.mutate(payload);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-dark-900 dark:text-white">New Project</h2>
                <p className="text-xs text-dark-400">Linked to: <span className="text-primary-500 font-medium">{customerName}</span></p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Project Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Website Redesign" className="input w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full h-16 resize-none" placeholder="Brief description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Deadline</label>
                <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Budget ($)</label>
                <input type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><FolderKanban className="w-4 h-4" /> Create Project</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Customer Card ────────────────────────────────────────────────
function CustomerCard({ customer, onEdit, onDelete, onAddProject }: { customer: Customer; onEdit: () => void; onDelete: () => void; onAddProject: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <motion.div className="card-hover p-4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {customer.first_name[0]}{customer.last_name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-dark-900 dark:text-white text-sm">{customer.full_name}</h3>
            <p className="text-xs text-dark-400">{customer.company_name || 'Individual'}</p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700">
            <MoreHorizontal className="w-4 h-4 text-dark-400" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div className="absolute right-0 top-8 w-44 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 shadow-lg z-10 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <button onClick={() => { onAddProject(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <FolderKanban className="w-4 h-4" /> Add Project
                </button>
                <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-700">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { onDelete(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-dark-500"><Mail className="w-3.5 h-3.5" /><span className="truncate">{customer.email}</span></div>
        {customer.phone && <div className="flex items-center gap-2 text-xs text-dark-500"><Phone className="w-3.5 h-3.5" /><span>{customer.phone}</span></div>}
        {customer.country && <div className="flex items-center gap-2 text-xs text-dark-500"><Building2 className="w-3.5 h-3.5" /><span>{customer.city ? `${customer.city}, ` : ''}{customer.country}</span></div>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-dark-100 dark:border-dark-700">
        <span className={cn('badge text-xs', statusColors[customer.status] || 'badge-gray')}>
          {customer.status === 'vip' && <Star className="w-3 h-3" />}
          {customer.status}
        </span>
        <span className="text-xs font-semibold text-dark-700 dark:text-dark-300">${Number(customer.total_revenue).toLocaleString()}</span>
      </div>

      {/* Add Project quick button */}
      <button
        onClick={onAddProject}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-primary-300 dark:border-primary-700 text-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
      >
        <FolderKanban className="w-3.5 h-3.5" /> Add Project
      </button>

      {customer.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {customer.tags.slice(0, 3).map((tag) => <span key={tag} className="text-xs px-1.5 py-0.5 bg-dark-100 dark:bg-dark-700 rounded text-dark-500">{tag}</span>)}
        </div>
      )}
    </motion.div>
  );
}

// ── Lead Row ─────────────────────────────────────────────────────
function LeadRow({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient();
  const convertMutation = useMutation({
    mutationFn: () => crmAPI.convertLead(lead.id),
    onSuccess: () => {
      toast.success('Lead converted to customer!');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to convert lead'),
  });

  return (
    <tr>
      <td className="px-4 py-3">
        <div className="font-medium text-dark-900 dark:text-white text-sm">{lead.first_name} {lead.last_name}</div>
        <div className="text-xs text-dark-400">{lead.company_name}</div>
      </td>
      <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">{lead.email}</td>
      <td className="px-4 py-3"><span className={cn('badge text-xs', statusColors[lead.status] || 'badge-gray')}>{lead.status}</span></td>
      <td className="px-4 py-3">
        <span className={cn('badge text-xs', { 'badge-error': lead.priority === 'high', 'badge-warning': lead.priority === 'medium', 'badge-gray': lead.priority === 'low' })}>
          {lead.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">
        {lead.expected_value ? `$${Number(lead.expected_value).toLocaleString()}` : '-'}
      </td>
      <td className="px-4 py-3">
        {lead.status !== 'converted' && lead.status !== 'lost' && (
          <button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending} className="btn btn-sm btn-primary">
            {convertMutation.isPending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3" />} Convert
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function CRMPage() {
  const [tab, setTab] = useState<'customers' | 'leads'>('customers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [projectModal, setProjectModal] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });
  const queryClient = useQueryClient();

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['customers', search, statusFilter],
    queryFn: () => crmAPI.getCustomers({ search, status: statusFilter || undefined }),
    enabled: tab === 'customers',
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', search],
    queryFn: () => crmAPI.getLeads({ search }),
    enabled: tab === 'leads',
  });

  const { data: statsData } = useQuery({ queryKey: ['crm-stats'], queryFn: () => crmAPI.getStats() });

  const stats = statsData?.data || {};
  const customers: Customer[] = customersData?.data?.results || customersData?.data || [];
  const leads: Lead[] = leadsData?.data?.results || leadsData?.data || [];

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => crmAPI.deleteCustomer(id),
    onSuccess: () => { toast.success('Customer deleted'); queryClient.invalidateQueries({ queryKey: ['customers'] }); },
    onError: () => toast.error('Failed to delete customer'),
  });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">CRM</h1>
          <p className="page-subtitle">Manage customers, leads, and relationships</p>
        </div>
        <button className="btn-primary" onClick={() => tab === 'customers' ? setShowCustomerModal(true) : setShowLeadModal(true)}>
          <Plus className="w-4 h-4" />
          {tab === 'customers' ? 'Add Customer' : 'Add Lead'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Customers', value: stats.total_customers || 0, color: 'text-blue-600' },
          { label: 'Active', value: stats.active_customers || 0, color: 'text-green-600' },
          { label: 'VIP', value: stats.vip_customers || 0, color: 'text-yellow-600' },
          { label: 'Total Leads', value: stats.total_leads || 0, color: 'text-purple-600' },
          { label: 'New Leads', value: stats.new_leads || 0, color: 'text-primary-600' },
          { label: 'Converted', value: stats.converted_leads || 0, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className={cn('text-2xl font-bold', s.color)}>{s.value}</div>
            <div className="text-xs text-dark-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="card p-1 inline-flex gap-1">
        {(['customers', 'leads'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-dark-500 hover:text-dark-700 hover:bg-dark-100 dark:hover:bg-dark-700')}>
            {t === 'customers' ? <><Users className="w-4 h-4 inline mr-1.5" />Customers</> : <><UserPlus className="w-4 h-4 inline mr-1.5" />Leads</>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder={`Search ${tab}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        {tab === 'customers' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[140px]">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="prospect">Prospect</option>
            <option value="vip">VIP</option>
          </select>
        )}
      </div>

      {/* Customers */}
      {tab === 'customers' && (
        customersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="card p-12 text-center">
            <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <h3 className="text-dark-600 dark:text-dark-300 font-medium">No customers found</h3>
            <p className="text-dark-400 text-sm mt-1">Add your first customer to get started</p>
            <button className="btn-primary mx-auto mt-4" onClick={() => setShowCustomerModal(true)}><Plus className="w-4 h-4" /> Add Customer</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={() => { setEditCustomer(customer); setShowCustomerModal(true); }}
                onDelete={() => deleteCustomerMutation.mutate(customer.id)}
                onAddProject={() => setProjectModal({ open: true, id: customer.id, name: customer.full_name })}
              />
            ))}
          </div>
        )
      )}

      {/* Leads */}
      {tab === 'leads' && (
        <div className="table-container">
          {leadsLoading ? (
            <div className="p-8 text-center text-dark-400">Loading leads...</div>
          ) : (
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Priority</th><th>Value</th><th>Actions</th></tr></thead>
              <tbody>
                {leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
                {leads.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">
                    No leads found. <button className="text-primary-500 underline ml-1" onClick={() => setShowLeadModal(true)}>Add one?</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      <AddCustomerModal
        open={showCustomerModal}
        onClose={() => { setShowCustomerModal(false); setEditCustomer(null); }}
        editData={editCustomer}
      />
      <AddLeadModal open={showLeadModal} onClose={() => setShowLeadModal(false)} />
      <AddProjectFromCRMModal
        open={projectModal.open}
        onClose={() => setProjectModal({ open: false, id: '', name: '' })}
        customerId={projectModal.id}
        customerName={projectModal.name}
      />
    </div>
  );
}
