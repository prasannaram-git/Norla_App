'use client';

import { useEffect, useState } from 'react';
import { Users, ScanLine, MessageSquare, Key, TrendingUp, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalScans: number;
  scansToday: number;
  otpsToday: number;
  activeKeys: number;
  recentActivity: Array<{ id: string; action: string; user_phone: string; created_at: string; details: Record<string, string> }>;
  recentScans: Array<{ id: string; user_id: string; status: string; overall_balance_score: number; created_at: string }>;
}

function useAdminFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading };
}

export default function AdminDashboard() {
  const { data: stats, loading } = useAdminFetch<Stats>('/api/admin/stats');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: '#2563EB' },
    { label: 'Total Scans', value: stats?.totalScans ?? 0, icon: ScanLine, color: '#059669' },
    { label: 'Scans Today', value: stats?.scansToday ?? 0, icon: TrendingUp, color: '#8B5CF6' },
    { label: 'OTPs Sent Today', value: stats?.otpsToday ?? 0, icon: MessageSquare, color: '#D97706' },
    { label: 'Active API Keys', value: stats?.activeKeys ?? 0, icon: Key, color: '#0EA5E9' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-neutral-400 mt-1">System overview and recent activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4 mb-10">
        {statCards.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl bg-white p-5 transition-shadow hover:shadow-md"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3" style={{ backgroundColor: `${item.color}0D` }}>
              <item.icon className="h-4.5 w-4.5" style={{ color: item.color }} />
            </div>
            <p className="text-[28px] font-bold text-neutral-900 tracking-tight leading-none mb-1">{item.value}</p>
            <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity + Recent Scans */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-neutral-400" />
            <h2 className="text-[14px] font-bold text-neutral-900">Recent Activity</h2>
          </div>

          {(stats?.recentActivity?.length ?? 0) === 0 ? (
            <p className="text-[13px] text-neutral-400 py-8 text-center">No activity recorded yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentActivity?.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-700">{formatAction(a.action)}</p>
                    <p className="text-[11px] text-neutral-400">{a.user_phone || '—'}</p>
                  </div>
                  <p className="text-[11px] text-neutral-400">{timeAgo(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scans */}
        <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2 mb-5">
            <ScanLine className="h-4 w-4 text-neutral-400" />
            <h2 className="text-[14px] font-bold text-neutral-900">Recent Scans</h2>
          </div>

          {(stats?.recentScans?.length ?? 0) === 0 ? (
            <p className="text-[13px] text-neutral-400 py-8 text-center">No scans yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentScans?.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-neutral-700 font-mono">{s.id.slice(0, 8)}...</p>
                    <p className="text-[11px] text-neutral-400">Score: {s.overall_balance_score ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      s.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      s.status === 'processing' ? 'bg-amber-50 text-amber-600' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>{s.status}</span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">{timeAgo(s.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    otp_sent: 'OTP Sent',
    otp_verified: 'OTP Verified',
    scan_started: 'Scan Started',
    scan_completed: 'Scan Completed',
    user_login: 'User Login',
  };
  return map[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
