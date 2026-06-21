'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { notificationsAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, Search, Moon, Sun, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export function Navbar() {
  const router = useRouter();
  const { toggleSidebar, theme, setTheme } = useUIStore();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    refetchInterval: 30000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll({ unread: true }),
    enabled: notifOpen,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });

  const unreadCount = unreadData?.data?.count || 0;
  const notifications = notifData?.data?.results || [];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="h-16 bg-white dark:bg-dark-900 border-b border-dark-100 dark:border-dark-800 flex items-center gap-4 px-4 sticky top-0 z-10">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search customers, invoices, tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-dark-50 dark:bg-dark-800 border border-dark-200 dark:border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 shadow-lg p-2 z-50">
              <p className="text-xs text-dark-400 px-2 py-1">Press Enter to search for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 shadow-xl z-50"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-center justify-between p-4 border-b border-dark-100 dark:border-dark-700">
                  <h3 className="font-semibold text-dark-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-dark-100 dark:divide-dark-700">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-dark-400 text-sm">No new notifications</div>
                  ) : (
                    notifications.slice(0, 10).map((notif: any) => (
                      <div
                        key={notif.id}
                        className={cn('p-3 hover:bg-dark-50 dark:hover:bg-dark-700/50 cursor-pointer transition-colors', !notif.is_read && 'bg-primary-50/50 dark:bg-primary-900/10')}
                      >
                        <div className="flex gap-3">
                          <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', !notif.is_read ? 'bg-primary-500' : 'bg-dark-300')} />
                          <div>
                            <p className="text-sm font-medium text-dark-900 dark:text-white">{notif.title}</p>
                            <p className="text-xs text-dark-500 mt-0.5 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-dark-400 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-dark-100 dark:border-dark-700">
                  <button
                    onClick={() => { router.push('/dashboard/notifications'); setNotifOpen(false); }}
                    className="w-full text-center text-sm text-primary-600 font-medium hover:text-primary-700"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <span className="text-sm font-medium text-dark-700 dark:text-dark-200 hidden sm:block">{user?.first_name}</span>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-dark-800 rounded-xl border border-dark-100 dark:border-dark-700 shadow-xl z-50 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="p-3 border-b border-dark-100 dark:border-dark-700">
                  <p className="font-semibold text-sm text-dark-900 dark:text-white">{user?.full_name}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{user?.email}</p>
                  <span className="badge badge-primary text-xs mt-1 capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { router.push('/dashboard/profile'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => { router.push('/dashboard/settings'); setProfileOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
