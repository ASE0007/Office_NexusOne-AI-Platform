'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingAPI, crmAPI } from '@/services/api';
import { Invoice } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  Receipt, Plus, Search, DollarSign, AlertTriangle, Download,
  Clock, X, Loader2, CreditCard, Wallet, FileText, Trash2
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'badge-gray', pending: 'badge-warning', paid: 'badge-success',
  overdue: 'badge-error', cancelled: 'badge-gray', refunded: 'badge-primary',
};

// ── New Invoice Modal ─────────────────────────────────────────────
function NewInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ customer: '', due_date: '', currency: 'USD', notes: '', tax_rate: '0', discount: '0' });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: '' }]);

  const { data: customersData } = useQuery({ queryKey: ['customers-billing'], queryFn: () => crmAPI.getCustomers(), enabled: open });
  const customers = customersData?.data?.results || customersData?.data || [];

  const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price || 0)), 0);
  const discountAmt = subtotal * (Number(form.discount) / 100);
  const taxAmt = (subtotal - discountAmt) * (Number(form.tax_rate) / 100);
  const total = subtotal - discountAmt + taxAmt;

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const updated = [...items]; updated[i] = { ...updated[i], [field]: value }; setItems(updated);
  };

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const invoiceRes = await billingAPI.createInvoice({
        customer: data.customer || undefined,
        due_date: data.due_date,
        currency: data.currency,
        notes: data.notes,
        tax_rate: data.tax_rate,
        discount: data.discount,
      });
      const invoiceId = invoiceRes.data.id;
      for (const item of data.items) {
        if (item.description && item.unit_price) {
          await billingAPI.addInvoiceItem(invoiceId, item);
        }
      }
      return invoiceRes;
    },
    onSuccess: () => {
      toast.success('Invoice created!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      onClose();
      setForm({ customer: '', due_date: '', currency: 'USD', notes: '', tax_rate: '0', discount: '0' });
      setItems([{ description: '', quantity: 1, unit_price: '' }]);
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create invoice'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.due_date) { toast.error('Due date is required'); return; }
    if (!items.some(i => i.description && i.unit_price)) { toast.error('Add at least one line item'); return; }
    mutation.mutate({ ...form, items });
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">New Invoice</h2><p className="text-xs text-dark-400">Create a professional invoice</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Customer</label>
                <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input w-full">
                  <option value="">No Customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.full_name} {c.company_name ? `— ${c.company_name}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Due Date <span className="text-red-500">*</span></label>
                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="input w-full" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Currency</label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="input w-full">
                  {['USD', 'EUR', 'GBP', 'BDT', 'INR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Tax Rate (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Discount (%)</label>
                <input type="number" min="0" max="100" step="0.1" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="input w-full" />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">Line Items <span className="text-red-500">*</span></label>
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-dark-400 px-1">
                  <span className="col-span-6">Description</span><span className="col-span-2 text-center">Qty</span><span className="col-span-3 text-center">Unit Price</span><span className="col-span-1"></span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input type="text" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="Description" className="input col-span-6 text-sm" />
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="input col-span-2 text-sm text-center" />
                    <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} placeholder="0.00" className="input col-span-3 text-sm" />
                    <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="col-span-1 p-2 rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Add line item
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-dark-50 dark:bg-dark-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-dark-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {Number(form.discount) > 0 && <div className="flex justify-between text-red-500"><span>Discount ({form.discount}%)</span><span>-${discountAmt.toFixed(2)}</span></div>}
              {Number(form.tax_rate) > 0 && <div className="flex justify-between text-dark-500"><span>Tax ({form.tax_rate}%)</span><span>+${taxAmt.toFixed(2)}</span></div>}
              <div className="flex justify-between font-bold text-dark-900 dark:text-white text-base pt-2 border-t border-dark-200 dark:border-dark-600"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-16 resize-none" placeholder="Payment terms, thank you note, etc." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><FileText className="w-4 h-4" /> Create Invoice</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Record Payment Modal ──────────────────────────────────────────
function RecordPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ invoice: '', amount: '', method: 'cash', transaction_id: '', notes: '', payment_date: new Date().toISOString().split('T')[0] });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-for-payment'],
    queryFn: () => billingAPI.getInvoices({ status: 'pending' }),
    enabled: open,
  });
  const invoices = invoicesData?.data?.results || invoicesData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: object) => billingAPI.createPayment(data),
    onSuccess: () => {
      toast.success('Payment recorded!');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      onClose();
      setForm({ invoice: '', amount: '', method: 'cash', transaction_id: '', notes: '', payment_date: new Date().toISOString().split('T')[0] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to record payment'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) { toast.error('Amount is required'); return; }
    const payload: any = { ...form };
    if (!payload.invoice) delete payload.invoice;
    if (!payload.transaction_id) delete payload.transaction_id;
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><CreditCard className="w-5 h-5 text-green-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Record Payment</h2><p className="text-xs text-dark-400">Log an incoming payment</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Link to Invoice</label>
              <select value={form.invoice} onChange={(e) => setForm({ ...form, invoice: e.target.value })} className="input w-full">
                <option value="">No Invoice</option>
                {invoices.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.invoice_number} — ${Number(inv.total).toLocaleString()} ({inv.customer_name || 'No customer'})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Amount ($) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Payment Date</label>
                <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Payment Method</label>
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input w-full">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="stripe">Stripe</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Transaction ID</label>
              <input type="text" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} placeholder="TXN123456" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-16 resize-none" placeholder="Any additional notes..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording...</> : <><CreditCard className="w-4 h-4" /> Record Payment</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Add Expense Modal ─────────────────────────────────────────────
function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', amount: '', category: 'office', expense_date: new Date().toISOString().split('T')[0], description: '', receipt: null as File | null });

  const mutation = useMutation({
    mutationFn: (data: FormData) => billingAPI.createExpense(data),
    onSuccess: () => {
      toast.success('Expense added!');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['billing-stats'] });
      onClose();
      setForm({ title: '', amount: '', category: 'office', expense_date: new Date().toISOString().split('T')[0], description: '', receipt: null });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add expense'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount) { toast.error('Title and amount are required'); return; }
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('amount', form.amount);
    fd.append('category', form.category);
    fd.append('expense_date', form.expense_date);
    fd.append('description', form.description);
    if (form.receipt) fd.append('receipt', form.receipt);
    mutation.mutate(fd);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-orange-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Expense</h2><p className="text-xs text-dark-400">Log a business expense</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Office supplies" className="input w-full" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Amount ($) <span className="text-red-500">*</span></label>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Date</label>
                <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input w-full">
                <option value="office">Office</option>
                <option value="travel">Travel</option>
                <option value="meals">Meals & Entertainment</option>
                <option value="software">Software & Subscriptions</option>
                <option value="hardware">Hardware & Equipment</option>
                <option value="marketing">Marketing</option>
                <option value="utilities">Utilities</option>
                <option value="rent">Rent</option>
                <option value="salary">Salary</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full h-16 resize-none" placeholder="Description of the expense..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Receipt (optional)</label>
              <input type="file" accept="image/*,.pdf" onChange={(e) => setForm({ ...form, receipt: e.target.files?.[0] || null })} className="input w-full text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Wallet className="w-4 h-4" /> Add Expense</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Main Billing Page ─────────────────────────────────────────────
export default function BillingPage() {
  const [tab, setTab] = useState<'invoices' | 'payments' | 'expenses'>('invoices');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const { data: invoicesData, isLoading } = useQuery({ queryKey: ['invoices', search, statusFilter], queryFn: () => billingAPI.getInvoices({ search, status: statusFilter || undefined }), enabled: tab === 'invoices' });
  const { data: paymentsData } = useQuery({ queryKey: ['payments'], queryFn: () => billingAPI.getPayments(), enabled: tab === 'payments' });
  const { data: expensesData } = useQuery({ queryKey: ['expenses'], queryFn: () => billingAPI.getExpenses(), enabled: tab === 'expenses' });
  const { data: statsData } = useQuery({ queryKey: ['billing-stats'], queryFn: billingAPI.getStats });

  const stats = statsData?.data || {};
  const invoices: Invoice[] = invoicesData?.data?.results || invoicesData?.data || [];
  const payments = paymentsData?.data?.results || paymentsData?.data || [];
  const expenses = expensesData?.data?.results || expensesData?.data || [];

  const downloadPDF = async (id: string, invoiceNumber: string) => {
    try {
      const response = await billingAPI.downloadPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${invoiceNumber}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch { toast.error('Failed to download invoice'); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Billing & Finance</h1><p className="page-subtitle">Manage invoices, payments, and expenses</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowPaymentModal(true)} className="btn-secondary"><CreditCard className="w-4 h-4" /> Record Payment</button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-secondary"><Wallet className="w-4 h-4" /> Add Expense</button>
          <button onClick={() => setShowInvoiceModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Invoice</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: `$${Number(stats.total_invoiced || 0).toLocaleString()}`, icon: Receipt, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
          { label: 'Total Collected', value: `$${Number(stats.total_collected || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
          { label: 'Pending', value: `$${Number(stats.pending_amount || 0).toLocaleString()}`, icon: Clock, color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600' },
          { label: 'Overdue', value: `$${Number(stats.overdue_amount || 0).toLocaleString()}`, icon: AlertTriangle, color: 'bg-red-50 dark:bg-red-900/20 text-red-600' },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="card p-5 flex items-center gap-4"><div className={cn('p-3 rounded-xl', s.color)}><Icon className="w-5 h-5" /></div><div><div className="text-xl font-bold text-dark-900 dark:text-white">{s.value}</div><div className="text-xs text-dark-400">{s.label}</div></div></div>
        );})}
      </div>

      {/* Tabs */}
      <div className="card p-1 inline-flex gap-1">
        {(['invoices', 'payments', 'expenses'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-primary-600 text-white' : 'text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-700')}>{t}</button>
        ))}
      </div>

      {/* Invoices */}
      {tab === 'invoices' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" /><input type="text" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" /></div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto min-w-[130px]">
              <option value="">All Status</option>
              {['draft', 'pending', 'paid', 'overdue', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Amount</th><th>Due Date</th><th>Actions</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">Loading...</td></tr>
                  : invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3"><div className="font-medium text-dark-900 dark:text-white text-sm">{inv.invoice_number}</div><div className="text-xs text-dark-400">{new Date(inv.created_at).toLocaleDateString()}</div></td>
                    <td className="px-4 py-3 text-sm text-dark-600 dark:text-dark-300">{inv.customer_name || '-'}</td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', statusColors[inv.status] || 'badge-gray')}>{inv.status}</span></td>
                    <td className="px-4 py-3"><div className="font-semibold text-dark-900 dark:text-white text-sm">${Number(inv.total).toLocaleString()}</div><div className="text-xs text-dark-400">{inv.currency}</div></td>
                    <td className="px-4 py-3 text-sm text-dark-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => downloadPDF(inv.id, inv.invoice_number)} className="btn-ghost btn-sm" title="Download PDF"><Download className="w-3.5 h-3.5" /></button>
                        {inv.status === 'pending' && <button onClick={() => setShowPaymentModal(true)} className="btn-sm btn-primary text-xs"><CreditCard className="w-3 h-3" /> Pay</button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {!isLoading && invoices.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">No invoices. <button className="text-primary-500 underline ml-1" onClick={() => setShowInvoiceModal(true)}>Create one?</button></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payments */}
      {tab === 'payments' && (
        <>
          <div className="flex justify-end"><button onClick={() => setShowPaymentModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Record Payment</button></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Transaction</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-sm text-dark-700 dark:text-dark-300">{p.transaction_id || p.id.slice(0,8)}</td>
                    <td className="px-4 py-3 font-semibold text-dark-900 dark:text-white text-sm">${Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray text-xs capitalize">{p.method}</span></td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', p.status === 'success' ? 'badge-success' : p.status === 'failed' ? 'badge-error' : 'badge-warning')}>{p.status}</span></td>
                    <td className="px-4 py-3 text-sm text-dark-400">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-dark-400">No payments recorded yet</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Expenses */}
      {tab === 'expenses' && (
        <>
          <div className="flex justify-end"><button onClick={() => setShowExpenseModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Expense</button></div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {expenses.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">{e.title}</td>
                    <td className="px-4 py-3"><span className="badge badge-gray text-xs capitalize">{e.category}</span></td>
                    <td className="px-4 py-3 font-semibold text-dark-900 dark:text-white text-sm">${Number(e.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', e.status === 'approved' ? 'badge-success' : e.status === 'rejected' ? 'badge-error' : 'badge-warning')}>{e.status}</span></td>
                    <td className="px-4 py-3 text-sm text-dark-400">{new Date(e.expense_date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-dark-400">No expenses logged yet</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modals */}
      <NewInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
      <RecordPaymentModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
      <AddExpenseModal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} />
    </div>
  );
}
