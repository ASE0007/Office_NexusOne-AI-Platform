'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '@/services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const typeIcons: Record<string, any> = {
  info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle,
};
const typeColors: Record<string, string> = {
  info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  success: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  warning: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  error: 'text-red-500 bg-red-50 dark:bg-red-900/20',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => notificationsAPI.getAll(),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsAPI.markAllRead,
    onSuccess: () => {
      toast.success('All marked as read');
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const notifications = data?.data?.results || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay up to date with your workspace activity</p>
        </div>
        <button onClick={() => markAllMutation.mutate()} className="btn-secondary">
          <CheckCheck className="w-4 h-4" /> Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
        ) : notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 text-dark-300 mx-auto mb-3" />
            <h3 className="font-medium text-dark-600 dark:text-dark-300">No notifications yet</h3>
          </div>
        ) : (
          notifications.map((notif: any) => {
            const Icon = typeIcons[notif.notification_type] || Info;
            return (
              <motion.div
                key={notif.id}
                className={cn('card p-4 flex items-start gap-3 cursor-pointer hover:shadow-md transition-all', !notif.is_read && 'border-l-4 border-primary-500')}
                onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div className={cn('p-2 rounded-lg flex-shrink-0', typeColors[notif.notification_type])}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn('text-sm font-semibold', notif.is_read ? 'text-dark-600 dark:text-dark-300' : 'text-dark-900 dark:text-white')}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-dark-400 flex-shrink-0">{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-dark-500 mt-0.5">{notif.message}</p>
                </div>
                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
