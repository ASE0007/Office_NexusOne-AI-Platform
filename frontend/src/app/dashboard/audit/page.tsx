'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditAPI } from '@/services/api';
import { cn } from '@/utils/cn';
import { Shield, Search, Filter } from 'lucide-react';

const methodColors: Record<string, string> = {
  GET: 'badge-gray', POST: 'badge-success', PUT: 'badge-warning',
  PATCH: 'badge-primary', DELETE: 'badge-error',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', search, methodFilter],
    queryFn: () => auditAPI.getLogs({ search, action: methodFilter || undefined }),
  });

  const logs = data?.data?.results || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-600" /> Audit Logs
          </h1>
          <p className="page-subtitle">Track all system activities for security and compliance</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input type="text" placeholder="Search audit logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="input w-auto min-w-[130px]">
          <option value="">All Methods</option>
          {['POST', 'PUT', 'PATCH', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>User</th><th>Method</th><th>Resource</th><th>Path</th><th>Status</th><th>IP Address</th><th>Time</th></tr></thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">Loading audit logs...</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-sm font-medium text-dark-700 dark:text-dark-300">{log.user_name || 'System'}</td>
                <td className="px-4 py-3"><span className={cn('badge text-xs font-mono', methodColors[log.request_method] || 'badge-gray')}>{log.request_method}</span></td>
                <td className="px-4 py-3 text-sm text-dark-500 capitalize">{log.resource_type || '-'}</td>
                <td className="px-4 py-3 text-xs font-mono text-dark-500 max-w-[200px] truncate">{log.request_path}</td>
                <td className="px-4 py-3">
                  <span className={cn('badge text-xs', (log.response_status >= 200 && log.response_status < 300) ? 'badge-success' : log.response_status >= 400 ? 'badge-error' : 'badge-warning')}>
                    {log.response_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-dark-400 font-mono">{log.ip_address || '-'}</td>
                <td className="px-4 py-3 text-xs text-dark-400">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && logs.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-dark-400">No audit logs found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
