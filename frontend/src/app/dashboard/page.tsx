'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, aiAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, FolderKanban, Receipt,
  Headphones, UserCheck, AlertTriangle, Activity, Zap, ArrowUpRight,
  Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function StatCard({ title, value, change, changeType, icon: Icon, color, subtitle }: any) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-number mt-1">{value}</p>
          {subtitle && <p className="text-xs text-dark-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl', color)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-1">
          {changeType === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={cn('text-xs font-semibold', changeType === 'up' ? 'text-green-600' : 'text-red-600')}>
            {change}%
          </span>
          <span className="text-xs text-dark-400">vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => analyticsAPI.getDashboard(),
    refetchInterval: 60000,
  });

  const summary = analytics?.data?.summary || {};
  const charts = analytics?.data?.charts || {};

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const ticketDist = charts.ticket_distribution || [];
  const projectDist = charts.project_distribution || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
            {greeting()}, {user?.first_name}! 👋
          </h1>
          <p className="text-dark-500 text-sm mt-1">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-dark-500 bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 rounded-lg px-3 py-2">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue" icon={TrendingUp}
          value={`$${(summary.this_month_revenue || 0).toLocaleString()}`}
          change={summary.revenue_growth_percent}
          changeType={summary.revenue_growth_percent >= 0 ? 'up' : 'down'}
          subtitle="This month"
          color="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
        />
        <StatCard
          title="Customers" icon={Users}
          value={(summary.total_customers || 0).toLocaleString()}
          subtitle={`+${summary.new_customers_this_month || 0} this month`}
          color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Active Projects" icon={FolderKanban}
          value={summary.active_projects || 0}
          subtitle={summary.overdue_tasks > 0 ? `${summary.overdue_tasks} overdue tasks` : 'On track'}
          color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          title="Open Tickets" icon={Headphones}
          value={summary.open_tickets || 0}
          subtitle="Support tickets"
          color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
        />
        <StatCard
          title="Pending Invoices" icon={Receipt}
          value={summary.pending_invoices || 0}
          subtitle={`${summary.overdue_invoices || 0} overdue`}
          color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
        />
        <StatCard
          title="Employees" icon={UserCheck}
          value={summary.total_employees || 0}
          subtitle={`${summary.present_today || 0} present today`}
          color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
        />
        <StatCard
          title="Attendance Rate" icon={Activity}
          value={`${summary.attendance_rate || 0}%`}
          subtitle="Today's rate"
          color="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          title="Pending Tasks" icon={AlertTriangle}
          value={summary.pending_tasks || 0}
          subtitle={`${summary.overdue_tasks || 0} overdue`}
          color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-dark-900 dark:text-white">Revenue Overview</h2>
              <p className="text-xs text-dark-400">Last 12 months</p>
            </div>
            <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              {summary.revenue_growth_percent > 0 ? '+' : ''}{summary.revenue_growth_percent}%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts.monthly_revenue || []}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-dark-900 dark:text-white">Customer Growth</h2>
            <p className="text-xs text-dark-400">Last 6 months</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.customer_growth || []} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Distribution */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-dark-900 dark:text-white">Ticket Status</h2>
            <p className="text-xs text-dark-400">Support ticket breakdown</p>
          </div>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={ticketDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="count" paddingAngle={3}>
                  {ticketDist.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {ticketDist.map((item: any, i: number) => (
                <div key={item.status} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-dark-600 dark:text-dark-300 capitalize flex-1">{item.status}</span>
                  <span className="text-xs font-semibold text-dark-900 dark:text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Status */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="font-semibold text-dark-900 dark:text-white">Project Status</h2>
            <p className="text-xs text-dark-400">All projects overview</p>
          </div>
          <div className="space-y-3">
            {projectDist.map((item: any, i: number) => {
              const total = projectDist.reduce((a: number, b: any) => a + b.count, 0);
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-600 dark:text-dark-300 capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="font-semibold text-dark-900 dark:text-white">{item.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-dark-100 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-5">
        <h2 className="font-semibold text-dark-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'New Customer', href: '/dashboard/crm?new=customer', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100', icon: Users },
            { label: 'New Project', href: '/dashboard/projects?new=1', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 hover:bg-violet-100', icon: FolderKanban },
            { label: 'New Invoice', href: '/dashboard/billing?new=invoice', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 hover:bg-yellow-100', icon: Receipt },
            { label: 'New Ticket', href: '/dashboard/support?new=1', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 hover:bg-orange-100', icon: Headphones },
            { label: 'AI Copilot', href: '/dashboard/ai', color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 hover:bg-primary-100', icon: Zap },
            { label: 'Analytics', href: '/dashboard/analytics', color: 'bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100', icon: Activity },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={cn('flex flex-col items-center gap-2 p-4 rounded-xl transition-all cursor-pointer text-center', action.color)}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
