'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrmAPI, companiesAPI, authAPI } from '@/services/api';
import { Employee } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  UserCog, Users, Clock, CalendarOff, DollarSign, Search, Plus,
  CheckCircle2, XCircle, AlertCircle, Briefcase, X, Loader2,
  CalendarCheck, Banknote, UserPlus
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'badge-success', inactive: 'badge-gray', terminated: 'badge-error', on_leave: 'badge-warning',
};
const leaveStatusColors: Record<string, string> = {
  pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-error', cancelled: 'badge-gray',
};

// ── Add Employee Modal ────────────────────────────────────────────
function AddEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    user: '', employee_id: '', designation: '', department: '',
    employment_type: 'full_time', status: 'active', date_of_joining: '',
    basic_salary: '', phone: '', address: '',
  });

  const { data: usersData } = useQuery({ queryKey: ['users-hrm'], queryFn: () => authAPI.getUsers(), enabled: open });
  const { data: deptData } = useQuery({ queryKey: ['departments'], queryFn: () => companiesAPI.getDepartments(), enabled: open });

  const users = usersData?.data?.results || usersData?.data || [];
  const departments = deptData?.data?.results || deptData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: object) => hrmAPI.createEmployee(data),
    onSuccess: () => {
      toast.success('Employee added successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['hrm-stats'] });
      onClose();
      setForm({ user: '', employee_id: '', designation: '', department: '', employment_type: 'full_time', status: 'active', date_of_joining: '', basic_salary: '', phone: '', address: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add employee'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.user || !form.designation) { toast.error('User and Designation are required'); return; }
    const payload: any = { ...form };
    if (!payload.department) delete payload.department;
    if (!payload.basic_salary) delete payload.basic_salary;
    if (!payload.date_of_joining) delete payload.date_of_joining;
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><UserPlus className="w-5 h-5 text-blue-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Employee</h2><p className="text-xs text-dark-400">Register a new employee profile</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Select User Account <span className="text-red-500">*</span></label>
              <select value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} className="input w-full" required>
                <option value="">Choose user...</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.full_name || `${u.first_name} ${u.last_name}`} — {u.email}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Employee ID</label>
                <input type="text" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="EMP-001" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Designation <span className="text-red-500">*</span></label>
                <input type="text" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="Software Engineer" className="input w-full" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Department</label>
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input w-full">
                  <option value="">No Department</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Employment Type</label>
                <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="input w-full">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="intern">Intern</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Date of Joining</label>
                <input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Basic Salary ($)</label>
                <input type="number" min="0" step="0.01" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Phone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+880 1234 567890" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input w-full h-16 resize-none" placeholder="Employee address..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><UserPlus className="w-4 h-4" /> Add Employee</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Request Leave Modal ───────────────────────────────────────────
function RequestLeaveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });

  const mutation = useMutation({
    mutationFn: (data: object) => hrmAPI.createLeave(data),
    onSuccess: () => {
      toast.success('Leave request submitted!');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hrm-stats'] });
      onClose();
      setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to submit leave request'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) { toast.error('Start and end dates are required'); return; }
    if (new Date(form.end_date) < new Date(form.start_date)) { toast.error('End date must be after start date'); return; }
    mutation.mutate(form);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center"><CalendarOff className="w-5 h-5 text-yellow-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Request Leave</h2><p className="text-xs text-dark-400">Submit a leave request for approval</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Leave Type</label>
              <select value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} className="input w-full">
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">End Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input w-full" required />
              </div>
            </div>
            {form.start_date && form.end_date && new Date(form.end_date) >= new Date(form.start_date) && (
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                📅 {Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) requested
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input w-full h-20 resize-none" placeholder="Reason for leave..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><CalendarCheck className="w-4 h-4" /> Submit Request</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Add Salary Modal ──────────────────────────────────────────────
function AddSalaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    employee: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basic_salary: '', allowances: '', deductions: '', tax: '', status: 'pending', notes: '',
  });

  const { data: empData } = useQuery({ queryKey: ['employees-for-salary'], queryFn: () => hrmAPI.getEmployees({}), enabled: open });
  const employees = empData?.data?.results || empData?.data || [];

  const netSalary = (Number(form.basic_salary) + Number(form.allowances || 0)) - Number(form.deductions || 0) - Number(form.tax || 0);

  const mutation = useMutation({
    mutationFn: (data: object) => hrmAPI.createSalary(data),
    onSuccess: () => {
      toast.success('Salary record added!');
      queryClient.invalidateQueries({ queryKey: ['salaries'] });
      onClose();
      setForm({ employee: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), basic_salary: '', allowances: '', deductions: '', tax: '', status: 'pending', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add salary'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee || !form.basic_salary) { toast.error('Employee and salary are required'); return; }
    mutation.mutate({ ...form, net_salary: netSalary });
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><Banknote className="w-5 h-5 text-green-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Salary Record</h2><p className="text-xs text-dark-400">Process monthly salary for an employee</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Employee <span className="text-red-500">*</span></label>
              <select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} className="input w-full" required>
                <option value="">Select employee...</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.user_name} — {emp.designation}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Month</label>
                <select value={form.month} onChange={(e) => setForm({ ...form, month: Number(e.target.value) })} className="input w-full">
                  {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Year</label>
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} min="2020" max="2030" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Basic Salary ($) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={form.basic_salary} onChange={(e) => setForm({ ...form, basic_salary: e.target.value })} placeholder="0.00" className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Allowances ($)</label>
                <input type="number" min="0" step="0.01" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Deductions ($)</label>
                <input type="number" min="0" step="0.01" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Tax ($)</label>
                <input type="number" min="0" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
            </div>
            {form.basic_salary && (
              <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-between">
                <span className="text-sm text-green-700 dark:text-green-300 font-medium">Net Salary:</span>
                <span className="text-xl font-bold text-green-700 dark:text-green-300">${netSalary.toLocaleString()}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Payment Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input w-full">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-16 resize-none" placeholder="Any notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Banknote className="w-4 h-4" /> Add Record</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Main HRM Page ─────────────────────────────────────────────────
export default function HRMPage() {
  const [tab, setTab] = useState<'employees' | 'attendance' | 'leaves' | 'salaries'>('employees');
  const [search, setSearch] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showRequestLeave, setShowRequestLeave] = useState(false);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const queryClient = useQueryClient();

  const { data: employeesData, isLoading: empLoading } = useQuery({ queryKey: ['employees', search], queryFn: () => hrmAPI.getEmployees({ search }), enabled: tab === 'employees' });
  const { data: attendanceData, isLoading: attLoading } = useQuery({ queryKey: ['attendance'], queryFn: () => hrmAPI.getAttendance(), enabled: tab === 'attendance' });
  const { data: leavesData, isLoading: leavesLoading } = useQuery({ queryKey: ['leaves'], queryFn: () => hrmAPI.getLeaves({ status: 'pending' }), enabled: tab === 'leaves' });
  const { data: salariesData } = useQuery({ queryKey: ['salaries'], queryFn: () => hrmAPI.getSalaries(), enabled: tab === 'salaries' });
  const { data: statsData } = useQuery({ queryKey: ['hrm-stats'], queryFn: hrmAPI.getStats });

  const checkInMutation = useMutation({
    mutationFn: (action: string) => hrmAPI.markAttendance({ action }),
    onSuccess: (_, action) => { toast.success(action === 'check_in' ? 'Checked in!' : 'Checked out!'); queryClient.invalidateQueries({ queryKey: ['attendance'] }); },
    onError: () => toast.error('Attendance action failed'),
  });

  const approveLeave = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => hrmAPI.approveLeave(id, { action }),
    onSuccess: (_, { action }) => { toast.success(`Leave ${action}d`); queryClient.invalidateQueries({ queryKey: ['leaves'] }); },
    onError: () => toast.error('Action failed'),
  });

  const stats = statsData?.data || {};
  const employees: Employee[] = employeesData?.data?.results || employeesData?.data || [];
  const attendance = attendanceData?.data?.results || attendanceData?.data || [];
  const leaves = leavesData?.data?.results || leavesData?.data || [];
  const salaries = salariesData?.data?.results || salariesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Human Resources</h1><p className="page-subtitle">Manage employees, attendance, leaves, and payroll</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => checkInMutation.mutate('check_in')} disabled={checkInMutation.isPending} className="btn-secondary"><Clock className="w-4 h-4" /> Check In</button>
          <button onClick={() => checkInMutation.mutate('check_out')} disabled={checkInMutation.isPending} className="btn-secondary"><Clock className="w-4 h-4" /> Check Out</button>
          <button onClick={() => setShowRequestLeave(true)} className="btn-secondary"><CalendarOff className="w-4 h-4" /> Request Leave</button>
          {tab === 'salaries' && <button onClick={() => setShowAddSalary(true)} className="btn-secondary"><Banknote className="w-4 h-4" /> Add Salary</button>}
          <button onClick={() => setShowAddEmployee(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Employee</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.total_employees || 0, icon: Users, color: 'text-blue-600' },
          { label: 'Present Today', value: stats.present_today || 0, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'On Leave', value: stats.on_leave || 0, icon: CalendarOff, color: 'text-yellow-600' },
          { label: 'Pending Leaves', value: stats.pending_leaves || 0, icon: AlertCircle, color: 'text-orange-600' },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="card p-5 flex items-center gap-4"><Icon className={cn('w-8 h-8', s.color)} /><div><div className="text-2xl font-bold text-dark-900 dark:text-white">{s.value}</div><div className="text-xs text-dark-400">{s.label}</div></div></div>
        );})}
      </div>

      {/* Tabs */}
      <div className="card p-1 inline-flex gap-1 flex-wrap">
        {(['employees', 'attendance', 'leaves', 'salaries'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-primary-600 text-white' : 'text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-700')}>{t}</button>
        ))}
      </div>

      {/* Employees */}
      {tab === 'employees' && (
        <>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" /><input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" /></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Employee</th><th>Designation</th><th>Department</th><th>Type</th><th>Status</th><th>Salary</th><th>Joined</th></tr></thead>
              <tbody>
                {empLoading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">Loading...</td></tr>
                  : employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">{emp.user_name[0]}</div><div><div className="font-medium text-dark-900 dark:text-white text-sm">{emp.user_name}</div><div className="text-xs text-dark-400">{emp.employee_id}</div></div></div></td>
                    <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">{emp.designation}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{emp.department_name || 'N/A'}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray text-xs capitalize">{emp.employment_type.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', statusColors[emp.status] || 'badge-gray')}>{emp.status}</span></td>
                    <td className="px-4 py-3 font-medium text-dark-900 dark:text-white text-sm">${Number(emp.basic_salary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-dark-400">{new Date(emp.date_of_joining).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!empLoading && employees.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">No employees found. <button className="text-primary-500 underline ml-1" onClick={() => setShowAddEmployee(true)}>Add one?</button></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Attendance */}
      {tab === 'attendance' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th></tr></thead>
            <tbody>
              {attLoading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">Loading...</td></tr>
                : attendance.map((a: any) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">{a.employee_name}</td>
                  <td className="px-4 py-3 text-sm text-dark-500">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className={cn('badge text-xs', a.status === 'present' ? 'badge-success' : a.status === 'absent' ? 'badge-error' : 'badge-warning')}>{a.status}</span></td>
                  <td className="px-4 py-3 text-sm text-dark-500">{a.check_in || '-'}</td>
                  <td className="px-4 py-3 text-sm text-dark-500">{a.check_out || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-300">{a.work_hours}h</td>
                </tr>
              ))}
              {!attLoading && attendance.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">No attendance records</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Leaves */}
      {tab === 'leaves' && (
        <>
          <div className="flex justify-end"><button onClick={() => setShowRequestLeave(true)} className="btn-primary"><Plus className="w-4 h-4" /> Request Leave</button></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {leavesLoading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">Loading...</td></tr>
                  : leaves.map((l: any) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">{l.employee_name}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray text-xs capitalize">{l.leave_type}</span></td>
                    <td className="px-4 py-3 text-sm text-dark-500">{new Date(l.start_date).toLocaleDateString()} – {new Date(l.end_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-300">{l.days}</td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', leaveStatusColors[l.status] || 'badge-gray')}>{l.status}</span></td>
                    <td className="px-4 py-3">{l.status === 'pending' && (<div className="flex gap-2"><button onClick={() => approveLeave.mutate({ id: l.id, action: 'approve' })} className="btn-sm btn-primary"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button><button onClick={() => approveLeave.mutate({ id: l.id, action: 'reject' })} className="btn-sm btn-danger"><XCircle className="w-3.5 h-3.5" /> Reject</button></div>)}</td>
                  </tr>
                ))}
                {!leavesLoading && leaves.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">No pending leave requests</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Salaries */}
      {tab === 'salaries' && (
        <>
          <div className="flex justify-end"><button onClick={() => setShowAddSalary(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Salary Record</button></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Employee</th><th>Month/Year</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Status</th></tr></thead>
              <tbody>
                {salaries.map((s: any) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">{s.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{s.month}/{s.year}</td>
                    <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">${Number(s.basic_salary).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-green-600">+${Number(s.allowances || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-red-500">-${Number(s.deductions || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-dark-900 dark:text-white text-sm">${Number(s.net_salary).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', s.status === 'paid' ? 'badge-success' : 'badge-warning')}>{s.status}</span></td>
                  </tr>
                ))}
                {salaries.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">No salary records. <button className="text-primary-500 underline ml-1" onClick={() => setShowAddSalary(true)}>Add one?</button></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <AddEmployeeModal open={showAddEmployee} onClose={() => setShowAddEmployee(false)} />
      <RequestLeaveModal open={showRequestLeave} onClose={() => setShowRequestLeave(false)} />
      <AddSalaryModal open={showAddSalary} onClose={() => setShowAddSalary(false)} />
    </div>
  );
}
