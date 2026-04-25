'use client';

import { useState } from 'react';
import { Users, Search, Phone, Calendar, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useAdminFetch } from '../admin-hooks';

interface UserRow {
  id: string;
  name: string;
  phone: string;
  dob: string;
  sex: string;
  created_at: string;
  last_login_at: string;
}

export default function AdminUsersPage() {
  const { data, loading, error, refetch } = useAdminFetch<{ users: UserRow[] }>('/api/admin/users');
  const [search, setSearch] = useState('');

  const users = data?.users || [];
  const filtered = users.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.phone || '').includes(search)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Users</h1>
          <p className="text-[13px] text-neutral-400 mt-1">{users.length} registered users</p>
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
            placeholder="Search by name or phone..."
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
            <Users className="h-8 w-8 text-neutral-300 mb-3" />
            <p className="text-[13px] text-neutral-400">No users found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden sm:table-cell">Details</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider hidden lg:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 shrink-0">
                        <span className="text-[11px] font-bold text-neutral-600">
                          {(user.name || 'U').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-neutral-900 truncate">{user.name || 'Unknown'}</p>
                        <p className="text-[11px] text-neutral-400">{user.sex || '—'} {user.dob ? `• DOB: ${user.dob}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                      <Phone className="h-3 w-3 text-neutral-400" />
                      {user.phone || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      Last login: {user.last_login_at ? timeAgo(user.last_login_at) : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      user.name ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {user.name ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                      <Calendar className="h-3 w-3 text-neutral-400" />
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
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

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
