'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }

      localStorage.setItem('admin_token', data.token);
      router.push('/admin');
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-50" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
      <div className="w-full max-w-sm px-6">
        <div className="flex flex-col items-center mb-10">
          <img src="/logo.png" alt="Norla" className="h-16 w-16 object-contain mb-4" />
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Admin Panel</h1>
          <p className="text-[13px] text-neutral-400 mt-1">Norla administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 rounded-xl bg-white px-4 text-[14px] text-neutral-900 outline-none transition-all focus:ring-2 focus:ring-neutral-900/10"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl bg-white px-4 text-[14px] text-neutral-900 outline-none transition-all focus:ring-2 focus:ring-neutral-900/10"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-600 bg-red-50 rounded-xl p-3 font-medium" style={{ border: '1px solid rgba(220,38,38,0.1)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full h-12 rounded-xl bg-neutral-900 text-[14px] font-semibold text-white transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
