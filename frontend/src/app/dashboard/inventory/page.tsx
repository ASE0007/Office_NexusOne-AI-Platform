'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI } from '@/services/api';
import { InventoryItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  Package, Plus, Search, AlertTriangle, Warehouse, Truck,
  Tag, ArrowDown, ArrowUp, Filter, X, Loader2, BarChart3
} from 'lucide-react';

const statusColors: Record<string, string> = {
  active: 'badge-success', inactive: 'badge-gray', discontinued: 'badge-error',
};

// ── Add Item Modal ────────────────────────────────────────────────
function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', description: '',
    category: '', supplier: '', status: 'active',
    quantity: '0', minimum_stock: '0', maximum_stock: '',
    cost_price: '', selling_price: '', unit: 'pcs',
  });

  const { data: categoriesData } = useQuery({ queryKey: ['inv-categories'], queryFn: inventoryAPI.getCategories, enabled: open });
  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: inventoryAPI.getSuppliers, enabled: open });
  const categories = categoriesData?.data?.results || categoriesData?.data || [];
  const suppliers = suppliersData?.data?.results || suppliersData?.data || [];

  const mutation = useMutation({
    mutationFn: (data: object) => inventoryAPI.createItem(data),
    onSuccess: () => {
      toast.success('Item added to inventory!');
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      onClose();
      setForm({ name: '', sku: '', barcode: '', description: '', category: '', supplier: '', status: 'active', quantity: '0', minimum_stock: '0', maximum_stock: '', cost_price: '', selling_price: '', unit: 'pcs' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add item'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Item name is required'); return; }
    const payload: any = { ...form };
    if (!payload.category) delete payload.category;
    if (!payload.supplier) delete payload.supplier;
    if (!payload.barcode) delete payload.barcode;
    if (!payload.maximum_stock) delete payload.maximum_stock;
    mutation.mutate(payload);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-2xl bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center"><Package className="w-5 h-5 text-primary-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Inventory Item</h2><p className="text-xs text-dark-400">Add a new product or item to stock</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Item Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Office Chair, Laptop, A4 Paper" className="input w-full" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">SKU</label>
                <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Barcode</label>
                <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="1234567890" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Unit</label>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input w-full">
                  {['pcs', 'box', 'kg', 'g', 'L', 'mL', 'm', 'set', 'pair', 'roll', 'sheet'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input w-full">
                  <option value="">No Category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Supplier</label>
                <select value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="input w-full">
                  <option value="">No Supplier</option>
                  {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Initial Qty</label>
                <input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Min Stock</label>
                <input type="number" min="0" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Max Stock</label>
                <input type="number" min="0" value={form.maximum_stock} onChange={(e) => setForm({ ...form, maximum_stock: e.target.value })} placeholder="Optional" className="input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Cost Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Selling Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} placeholder="0.00" className="input w-full" />
              </div>
            </div>
            {form.cost_price && form.selling_price && (
              <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                <span className="text-green-700 dark:text-green-300">Margin: </span>
                <span className="font-bold text-green-700 dark:text-green-300">
                  {(((Number(form.selling_price) - Number(form.cost_price)) / Number(form.cost_price)) * 100).toFixed(1)}%
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input w-full h-16 resize-none" placeholder="Item description..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Package className="w-4 h-4" /> Add Item</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Stock Movement Modal ──────────────────────────────────────────
function StockMovementModal({ open, onClose, itemId, itemName, type }: { open: boolean; onClose: () => void; itemId: string; itemName: string; type: 'in' | 'out' | 'transfer' | 'adjustment' }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ quantity: '1', reference: '', notes: '' });

  const mutation = useMutation({
    mutationFn: (data: object) => inventoryAPI.addMovement(data),
    onSuccess: () => {
      toast.success(`Stock ${type === 'in' ? 'added' : type === 'out' ? 'removed' : 'adjusted'}!`);
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      onClose();
      setForm({ quantity: '1', reference: '', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to record movement'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error('Quantity must be greater than 0'); return; }
    mutation.mutate({ item: itemId, movement_type: type, quantity: form.quantity, reference: form.reference, notes: form.notes });
  };

  const typeConfig = {
    in: { label: 'Stock In', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: ArrowDown },
    out: { label: 'Stock Out', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: ArrowUp },
    transfer: { label: 'Transfer', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: ArrowDown },
    adjustment: { label: 'Adjustment', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: BarChart3 },
  };
  const config = typeConfig[type];
  const Icon = config.icon;

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-md bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', config.bg)}><Icon className={cn('w-5 h-5', config.color)} /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">{config.label}</h2><p className="text-xs text-dark-400 truncate max-w-[200px]">{itemName}</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Quantity <span className="text-red-500">*</span></label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input w-full text-lg font-bold" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Reference</label>
              <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="PO-001, Order #123, Manual restock..." className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input w-full h-16 resize-none" placeholder="Any notes about this movement..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Icon className="w-4 h-4" /> Record {config.label}</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Add Supplier Modal ────────────────────────────────────────────
function AddSupplierModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', contact_person: '', address: '', website: '', notes: '' });

  const mutation = useMutation({
    mutationFn: (data: object) => inventoryAPI.createSupplier(data),
    onSuccess: () => {
      toast.success('Supplier added!');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      onClose();
      setForm({ name: '', email: '', phone: '', contact_person: '', address: '', website: '', notes: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to add supplier'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Supplier name is required'); return; }
    mutation.mutate(form);
  };

  if (!open) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="relative w-full max-w-lg bg-white dark:bg-dark-900 rounded-2xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-100 dark:border-dark-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><Truck className="w-5 h-5 text-green-600" /></div>
              <div><h2 className="text-lg font-bold text-dark-900 dark:text-white">Add Supplier</h2><p className="text-xs text-dark-400">Register a new supplier</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-700"><X className="w-5 h-5 text-dark-400" /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Company Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Supplier company name" className="input w-full" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Phone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Name of primary contact" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://supplier.com" className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input w-full h-16 resize-none" placeholder="Supplier address..." />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1">
                {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Truck className="w-4 h-4" /> Add Supplier</>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function InventoryPage() {
  const [tab, setTab] = useState<'items' | 'movements' | 'suppliers' | 'warehouses'>('items');
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [movementModal, setMovementModal] = useState<{ open: boolean; itemId: string; itemName: string; type: 'in' | 'out' | 'transfer' | 'adjustment' }>({ open: false, itemId: '', itemName: '', type: 'in' });

  const { data: itemsData, isLoading } = useQuery({ queryKey: ['inventory-items', search, showLowStock], queryFn: () => inventoryAPI.getItems({ search, ...(showLowStock ? { low_stock: true } : {}) }), enabled: tab === 'items' });
  const { data: movementsData } = useQuery({ queryKey: ['stock-movements'], queryFn: () => inventoryAPI.getMovements(), enabled: tab === 'movements' });
  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: inventoryAPI.getSuppliers, enabled: tab === 'suppliers' });
  const { data: warehousesData } = useQuery({ queryKey: ['warehouses'], queryFn: inventoryAPI.getWarehouses, enabled: tab === 'warehouses' });
  const { data: statsData } = useQuery({ queryKey: ['inventory-stats'], queryFn: inventoryAPI.getStats });

  const stats = statsData?.data || {};
  const items: InventoryItem[] = itemsData?.data?.results || itemsData?.data || [];
  const movements = movementsData?.data?.results || movementsData?.data || [];
  const suppliers = suppliersData?.data?.results || suppliersData?.data || [];
  const warehouses = warehousesData?.data?.results || warehousesData?.data || [];

  const openMovement = (item: InventoryItem, type: 'in' | 'out') =>
    setMovementModal({ open: true, itemId: item.id, itemName: item.name, type });

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div><h1 className="page-title">Inventory</h1><p className="page-subtitle">Manage products, stock, suppliers, and warehouses</p></div>
        <div className="flex gap-2 flex-wrap">
          {tab === 'suppliers' && <button onClick={() => setShowAddSupplier(true)} className="btn-secondary"><Truck className="w-4 h-4" /> Add Supplier</button>}
          <button onClick={() => setShowAddItem(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Item</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: stats.total_items || 0, icon: Package, color: 'text-primary-600' },
          { label: 'Low Stock', value: stats.low_stock_items || 0, icon: AlertTriangle, color: 'text-red-600' },
          { label: 'Categories', value: stats.total_categories || 0, icon: Tag, color: 'text-blue-600' },
          { label: 'Suppliers', value: stats.total_suppliers || 0, icon: Truck, color: 'text-green-600' },
          { label: 'Warehouses', value: stats.total_warehouses || 0, icon: Warehouse, color: 'text-orange-600' },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="card p-4 flex items-center gap-3"><Icon className={cn('w-6 h-6', s.color)} /><div><div className="text-xl font-bold text-dark-900 dark:text-white">{s.value}</div><div className="text-xs text-dark-400">{s.label}</div></div></div>
        );})}
      </div>

      {stats.low_stock_items > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300"><span className="font-semibold">{stats.low_stock_items} items</span> are below minimum stock level and need restocking.</p>
          <button onClick={() => { setShowLowStock(true); setTab('items'); }} className="ml-auto btn-sm btn-danger">View</button>
        </div>
      )}

      {/* Tabs */}
      <div className="card p-1 inline-flex gap-1 flex-wrap">
        {(['items', 'movements', 'suppliers', 'warehouses'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize', tab === t ? 'bg-primary-600 text-white' : 'text-dark-500 hover:bg-dark-100 dark:hover:bg-dark-700')}>{t}</button>
        ))}
      </div>

      {/* Items */}
      {tab === 'items' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" /><input type="text" placeholder="Search by name, SKU, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" /></div>
            <button onClick={() => setShowLowStock(!showLowStock)} className={cn('btn-sm', showLowStock ? 'btn-danger' : 'btn-secondary')}>
              <Filter className="w-4 h-4" /> {showLowStock ? 'Show All' : 'Low Stock Only'}
            </button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Item</th><th>SKU</th><th>Category</th><th>Qty</th><th>Min</th><th>Cost</th><th>Selling</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={9} className="px-4 py-12 text-center text-dark-400">Loading...</td></tr>
                  : items.map((item) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.is_low_stock && <span title="Low stock!"><AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" /></span>}
                        <div><div className="font-medium text-dark-900 dark:text-white text-sm">{item.name}</div>{item.supplier_name && <div className="text-xs text-dark-400">{item.supplier_name}</div>}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-dark-500">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-sm text-dark-500">{item.category_name || '-'}</td>
                    <td className="px-4 py-3"><span className={cn('font-bold text-sm', item.is_low_stock ? 'text-red-600' : 'text-dark-900 dark:text-white')}>{item.quantity}</span></td>
                    <td className="px-4 py-3 text-sm text-dark-500">{item.minimum_stock}</td>
                    <td className="px-4 py-3 text-sm text-dark-600">${Number(item.cost_price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">${Number(item.selling_price).toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={cn('badge text-xs', statusColors[item.status])}>{item.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openMovement(item, 'in')} className="btn-sm btn-secondary px-2" title="Stock In"><ArrowDown className="w-3.5 h-3.5 text-green-600" /></button>
                        <button onClick={() => openMovement(item, 'out')} className="btn-sm btn-secondary px-2" title="Stock Out"><ArrowUp className="w-3.5 h-3.5 text-red-600" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {!isLoading && items.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-dark-400">No items found. <button className="text-primary-500 underline ml-1" onClick={() => setShowAddItem(true)}>Add one?</button></td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Movements */}
      {tab === 'movements' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Item</th><th>Type</th><th>Quantity</th><th>Reference</th><th>By</th><th>Date</th></tr></thead>
            <tbody>
              {movements.map((m: any) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 text-sm font-medium text-dark-900 dark:text-white">{m.item_name || m.item}</td>
                  <td className="px-4 py-3"><span className={cn('badge text-xs flex items-center gap-1 w-fit', m.movement_type === 'in' ? 'badge-success' : m.movement_type === 'out' ? 'badge-error' : 'badge-warning')}>{m.movement_type === 'in' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}{m.movement_type}</span></td>
                  <td className="px-4 py-3 font-semibold text-sm text-dark-900 dark:text-white">{m.quantity}</td>
                  <td className="px-4 py-3 text-sm text-dark-500">{m.reference || '-'}</td>
                  <td className="px-4 py-3 text-sm text-dark-500">{m.performed_by || '-'}</td>
                  <td className="px-4 py-3 text-sm text-dark-400">{new Date(m.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {movements.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-dark-400">No stock movements yet</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s: any) => (
            <div key={s.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-dark-900 dark:text-white">{s.name}</h3>
                <span className={cn('badge text-xs', s.is_active ? 'badge-success' : 'badge-gray')}>{s.is_active ? 'Active' : 'Inactive'}</span>
              </div>
              {s.contact_person && <p className="text-sm text-dark-600 dark:text-dark-300 mb-1">👤 {s.contact_person}</p>}
              {s.email && <p className="text-sm text-dark-500 mb-1">✉️ {s.email}</p>}
              {s.phone && <p className="text-sm text-dark-500 mb-1">📞 {s.phone}</p>}
              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline">🌐 Website</a>}
            </div>
          ))}
          {suppliers.length === 0 && (
            <div className="col-span-3 card p-12 text-center">
              <Truck className="w-12 h-12 text-dark-300 mx-auto mb-3" />
              <p className="text-dark-400">No suppliers yet.</p>
              <button className="btn-primary mx-auto mt-3" onClick={() => setShowAddSupplier(true)}><Plus className="w-4 h-4" /> Add Supplier</button>
            </div>
          )}
        </div>
      )}

      {/* Warehouses */}
      {tab === 'warehouses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((w: any) => (
            <div key={w.id} className="card p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg"><Warehouse className="w-5 h-5 text-orange-600" /></div>
                <div><h3 className="font-semibold text-dark-900 dark:text-white">{w.name}</h3>{w.address && <p className="text-sm text-dark-400 mt-0.5">{w.address}</p>}</div>
              </div>
              {w.manager && <p className="text-sm text-dark-500">Manager: {w.manager}</p>}
            </div>
          ))}
          {warehouses.length === 0 && <div className="col-span-3 card p-12 text-center text-dark-400">No warehouses configured</div>}
        </div>
      )}

      {/* Modals */}
      <AddItemModal open={showAddItem} onClose={() => setShowAddItem(false)} />
      <AddSupplierModal open={showAddSupplier} onClose={() => setShowAddSupplier(false)} />
      <StockMovementModal
        open={movementModal.open}
        onClose={() => setMovementModal({ ...movementModal, open: false })}
        itemId={movementModal.itemId}
        itemName={movementModal.itemName}
        type={movementModal.type}
      />
    </div>
  );
}
