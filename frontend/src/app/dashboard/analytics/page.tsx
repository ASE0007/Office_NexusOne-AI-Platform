'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, aiAPI } from '@/services/api';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, RefreshCw, Brain } from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

export default function AnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState('month');

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: analyticsAPI.getDashboard,
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-analytics', revenuePeriod],
    queryFn: () => analyticsAPI.getRevenue({ period: revenuePeriod }),
  });

  const { data: customerData } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: analyticsAPI.getCustomers,
  });

  const { data: employeeData } = useQuery({
    queryKey: ['employee-analytics'],
    queryFn: analyticsAPI.getEmployees,
  });

  const { data: aiData } = useQuery({
    queryKey: ['ai-revenue-analysis'],
    queryFn: aiAPI.getRevenueAnalysis,
  });

  const summary = dashData?.data?.summary || {};
  const charts = dashData?.data?.charts || {};
  const revenue = revenueData?.data || {};
  const customers = customerData?.data || {};
  const employees = employeeData?.data || {};
  const aiAnalysis = aiData?.data?.analysis || '';
  const monthlyRevenue = aiData?.data?.monthly_data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="page-subtitle">Deep insights into your business performance</p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Revenue', value: `$${Number(summary.this_month_revenue || 0).toLocaleString()}`, trend: summary.revenue_growth_percent, icon: DollarSign, color: 'text-primary-600' },
          { label: 'Total Customers', value: summary.total_customers || 0, icon: Users, color: 'text-blue-600' },
          { label: 'Active Projects', value: summary.active_projects || 0, icon: BarChart3, color: 'text-green-600' },
          { label: 'Attendance Rate', value: `${summary.attendance_rate || 0}%`, icon: TrendingUp, color: 'text-orange-600' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} className="card p-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-dark-500">{kpi.label}</span>
                <Icon className={cn('w-5 h-5', kpi.color)} />
              </div>
              <div className="text-2xl font-bold text-dark-900 dark:text-white">{kpi.value}</div>
              {kpi.trend !== undefined && (
                <div className={cn('text-xs mt-1 font-medium', kpi.trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {kpi.trend >= 0 ? '↑' : '↓'} {Math.abs(kpi.trend)}% vs last month
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Overview with period filter */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-dark-900 dark:text-white">Revenue Analysis</h2>
            <p className="text-xs text-dark-400">Track revenue trends over time</p>
          </div>
          <div className="flex gap-1 card p-1">
            {['month', 'quarter', 'year'].map((p) => (
              <button key={p} onClick={() => setRevenuePeriod(p)} className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize', revenuePeriod === p ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-600')}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-dark-900 dark:text-white">${Number(revenue.revenue || 0).toLocaleString()}</div>
            <div className="text-xs text-dark-400">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">${Number(revenue.expenses || 0).toLocaleString()}</div>
            <div className="text-xs text-dark-400">Expenses</div>
          </div>
          <div className="text-center">
            <div className={cn('text-2xl font-bold', (revenue.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
              ${Number(revenue.profit || 0).toLocaleString()}
            </div>
            <div className="text-xs text-dark-400">Profit ({revenue.profit_margin || 0}%)</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={monthlyRevenue.length > 0 ? monthlyRevenue : charts.monthly_revenue || []}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer by Status */}
        <div className="card p-5">
          <h2 className="font-semibold text-dark-900 dark:text-white mb-4">Customer Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={customers.by_status || []} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="status" label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                {(customers.by_status || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Employee by Department */}
        <div className="card p-5">
          <h2 className="font-semibold text-dark-900 dark:text-white mb-4">Employees by Department</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={employees.by_department || []} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="department__name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers */}
      {customers.top_customers?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-dark-900 dark:text-white mb-4">Top Customers by Revenue</h2>
          <div className="space-y-3">
            {customers.top_customers.slice(0, 10).map((c: any, i: number) => {
              const maxRev = customers.top_customers[0]?.total_revenue || 1;
              const pct = Math.round((c.total_revenue / maxRev) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-dark-100 dark:bg-dark-700 flex items-center justify-center text-xs font-bold text-dark-500">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-dark-700 dark:text-dark-200">{c.first_name} {c.last_name}</span>
                      <span className="text-sm font-bold text-dark-900 dark:text-white">${Number(c.total_revenue).toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-dark-100 dark:bg-dark-700 rounded-full">
                      <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Revenue Analysis */}
      {aiAnalysis && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-dark-900 dark:text-white">AI Revenue Analysis</h2>
          </div>
          <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
        </div>
      )}
    </div>
  );
}
