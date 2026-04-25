'use client';

import { AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { useAdminFetch } from '../admin-hooks';

interface ActivityRow {
  id: string;
  user_id: string | null;
  user_phone: string | null;
  action: string;
  details: Record<string, string>;
  ip_address: string | null;
  created_at: string;
}

export default function AdminActivityPage() {
  const { data, loading, error, refetch } = useAdminFetch<{ activity: ActivityRow[] }>('/api/admin/activity');

  const activity = data?.activity || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Activity Log</h1>
          <p className="text-[13px] text-neutral-400 mt-1">All system activity and events</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 h-9 rounded-xl bg-white px-3 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-100 transition-all" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-[13px] text-neutral-400">{error}</p>
            <button onClick={refetch} className="text-[12px] font-semibold text-neutral-900 hover:underline">Retry</button>
          </div>
        ) : activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Activity className="h-8 w-8 text-neutral-300 mb-3" />
            <p className="text-[13px] text-neutral-400">No activity recorded</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Details</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((row) => (
                <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      row.action.includes('error') || row.action.includes('fail') ? 'bg-red-50 text-red-600' :
                      row.action.includes('verified') || row.action.includes('complete') ? 'bg-emerald-50 text-emerald-600' :
                      row.action.includes('sent') ? 'bg-blue-50 text-blue-600' :
                      'bg-neutral-100 text-neutral-600'
                    }`}>
                      {row.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] text-neutral-600">{row.user_phone || row.user_id?.slice(0, 12) || '—'}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-[11px] text-neutral-400 font-mono truncate max-w-xs">
                      {row.details ? JSON.stringify(row.details) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[12px] text-neutral-500">
                      {new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
