'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsAPI } from '@/services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { GitPullRequest, CheckCircle2, XCircle, Clock } from 'lucide-react';

const typeColors: Record<string, string> = {
  leave: 'badge-warning', expense: 'badge-primary', invoice: 'badge-success',
  purchase: 'badge-gray', document: 'badge-gray', task: 'badge-primary',
};

export default function ApprovalsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: () => approvalsAPI.getAll({ pending: true }),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      approvalsAPI.approve(id, { action }),
    onSuccess: (_, { action }) => {
      toast.success(`Request ${action}d`);
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
    onError: () => toast.error('Action failed'),
  });

  const approvals = data?.data?.results || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">Review and manage pending approval requests</p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)
        ) : approvals.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-medium text-dark-700 dark:text-dark-200">All caught up!</h3>
            <p className="text-dark-400 text-sm mt-1">No pending approval requests</p>
          </div>
        ) : (
          approvals.map((approval: any) => (
            <motion.div key={approval.id} className="card p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg mt-0.5">
                    <GitPullRequest className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-dark-900 dark:text-white text-sm">{approval.title}</h3>
                      <span className={cn('badge text-xs', typeColors[approval.request_type] || 'badge-gray')}>
                        {approval.request_type}
                      </span>
                    </div>
                    <p className="text-sm text-dark-500">{approval.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-dark-400">
                      <span>Requested by: <span className="text-dark-600 dark:text-dark-300 font-medium">{approval.requested_by_name}</span></span>
                      <span>{new Date(approval.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {approval.status === 'pending' && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => actionMutation.mutate({ id: approval.id, action: 'approve' })}
                      disabled={actionMutation.isPending}
                      className="btn-sm btn-primary"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => actionMutation.mutate({ id: approval.id, action: 'reject' })}
                      disabled={actionMutation.isPending}
                      className="btn-sm btn-danger"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
                {approval.status !== 'pending' && (
                  <span className={cn('badge text-xs', approval.status === 'approved' ? 'badge-success' : 'badge-error')}>
                    {approval.status}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
