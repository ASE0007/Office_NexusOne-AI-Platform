'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, Users, FolderKanban, CheckSquare, Receipt, Headphones,
  UserCog, Package, BarChart3, Bot, Bell, FileText, GitPullRequest,
  CalendarDays, Settings, ChevronLeft, ChevronRight, LogOut,
  Zap, Shield
} from 'lucide-react';

const navGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['all'] },
    ],
  },
  {
    label: 'Business',
    items: [
      { icon: Users, label: 'CRM', href: '/dashboard/crm', roles: ['all'] },
      { icon: FolderKanban, label: 'Projects', href: '/dashboard/projects', roles: ['all'] },
      { icon: CheckSquare, label: 'Tasks', href: '/dashboard/tasks', roles: ['all'] },
      { icon: CalendarDays, label: 'Calendar', href: '/dashboard/calendar', roles: ['all'] },
      { icon: Receipt, label: 'Billing', href: '/dashboard/billing', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { icon: Headphones, label: 'Support', href: '/dashboard/support', roles: ['all'] },
    ],
  },
  {
    label: 'Company',
    items: [
      { icon: UserCog, label: 'HRM', href: '/dashboard/hrm', roles: ['super_admin', 'company_admin', 'manager'] },
      { icon: Package, label: 'Inventory', href: '/dashboard/inventory', roles: ['super_admin', 'company_admin', 'manager'] },
      { icon: FileText, label: 'Documents', href: '/dashboard/documents', roles: ['all'] },
      { icon: GitPullRequest, label: 'Approvals', href: '/dashboard/approvals', roles: ['all'] },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', roles: ['super_admin', 'company_admin', 'manager', 'accountant'] },
      { icon: Bot, label: 'AI Copilot', href: '/dashboard/ai', roles: ['all'] },
    ],
  },
  {
    label: 'System',
    items: [
      { icon: Bell, label: 'Notifications', href: '/dashboard/notifications', roles: ['all'] },
      { icon: Shield, label: 'Audit Logs', href: '/dashboard/audit', roles: ['super_admin', 'company_admin'] },
      { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ['all'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUIStore();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  const canAccess = (roles: string[]) =>
    roles.includes('all') || (user && roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full bg-white dark:bg-dark-900 border-r border-dark-100 dark:border-dark-800 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-[70px]' : 'w-[260px]',
          !sidebarOpen && '-translate-x-full lg:translate-x-0'
        )}
        animate={{ width: sidebarCollapsed ? 70 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-800 h-16">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                className="flex items-center gap-2.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm text-dark-900 dark:text-white">NexusOne</div>
                  <div className="text-xs text-primary-500 font-medium">AI Platform</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {sidebarCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={toggleSidebarCollapsed}
            className="hidden lg:flex p-1 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => canAccess(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} className="mb-2">
                {!sidebarCollapsed && (
                  <div className="px-3 py-1 mb-1">
                    <span className="text-xs font-semibold text-dark-400 dark:text-dark-500 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'sidebar-link group',
                        active && 'active',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn('w-5 h-5 flex-shrink-0', active ? 'text-primary-600 dark:text-primary-400' : 'text-dark-400 dark:text-dark-500 group-hover:text-dark-700 dark:group-hover:text-dark-200')} />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {active && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-dark-100 dark:border-dark-800">
          <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-dark-900 dark:text-white truncate">{user?.full_name}</div>
                <div className="text-xs text-dark-400 capitalize truncate">{user?.role?.replace('_', ' ')}</div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-dark-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
