'use client';

import { useEffect, useState } from 'react';
import { Users, Search, Phone, Calendar, UserCheck, Clock } from 'lucide-react';

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
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
      </div>

      {/* Search */}
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

      {/* Table */}
      <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
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
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Details</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                        <span className="text-[11px] font-bold text-neutral-600">
                          {(user.name || 'U').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-neutral-900">{user.name || 'Unknown'}</p>
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
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                        <Clock className="h-3 w-3 text-neutral-400" />
                        Last login: {user.last_login_at ? timeAgo(user.last_login_at) : 'Never'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      user.name
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {user.name ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
