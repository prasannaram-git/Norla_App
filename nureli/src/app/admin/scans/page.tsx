'use client';

import { useState } from 'react';
import { ScanLine, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminFetch } from '../admin-hooks';

interface ScanRow {
  id: string;
  user_id: string;
  user_phone?: string;
  status: string;
  overall_balance_score: number | null;
  created_at: string;
}

export default function AdminScansPage() {
  const { data, loading, error, refetch } = useAdminFetch<{ scans: ScanRow[] }>('/api/admin/scans');
  const [search, setSearch] = useState('');

  const scans = data?.scans || [];
  const filtered = scans.filter((s) =>
    s.id.includes(search) || (s.user_id || '').includes(search) || (s.user_phone || '').includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Scans</h1>
          <p className="text-[13px] text-neutral-400 mt-1">{scans.length} total scans</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 h-9 rounded-xl bg-white px-3 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-100 transition-all" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by scan ID, user ID, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl bg-white pl-10 pr-4 text-[13px] text-neutral-900 outline-none transition-all focus:ring-2 focus:ring-neutral-900/10"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          />
        </div>
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ScanLine className="h-8 w-8 text-neutral-300 mb-3" />
            <p className="text-[13px] text-neutral-400">No scans found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Scan ID</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:table-cell">User</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((scan) => (
                <tr key={scan.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-[13px] font-mono font-medium text-neutral-700">{scan.id.slice(0, 12)}...</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <p className="text-[12px] text-neutral-500">{scan.user_phone || scan.user_id?.slice(0, 12) || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      scan.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      scan.status === 'processing' ? 'bg-amber-50 text-amber-600' :
                      scan.status === 'failed' ? 'bg-red-50 text-red-600' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {scan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[14px] font-bold text-neutral-900 tabular-nums">
                      {scan.overall_balance_score ?? '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-[12px] text-neutral-500">
                      {new Date(scan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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
