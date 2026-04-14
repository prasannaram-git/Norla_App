'use client';

import { useEffect, useState } from 'react';
import { Key, Plus, Trash2, Power, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

export default function AdminKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchKeys = () => {
    fetch('/api/admin/keys', { headers })
      .then((r) => r.json())
      .then((d) => setKeys(d.keys || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    await fetch('/api/admin/keys', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: newName || 'API Key', api_key: newKey }),
    });
    setNewName('');
    setNewKey('');
    setShowAdd(false);
    setSaving(false);
    fetchKeys();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch('/api/admin/keys', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, is_active: !active }),
    });
    fetchKeys();
  };

  const handleResetErrors = async (id: string) => {
    await fetch('/api/admin/keys', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, error_count: 0 }),
    });
    fetchKeys();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key?')) return;
    await fetch(`/api/admin/keys?id=${id}`, { method: 'DELETE', headers });
    fetchKeys();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Gemini API Keys</h1>
          <p className="text-[13px] text-neutral-400 mt-1">Manage multiple keys with automatic fallback</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 h-10 rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white hover:bg-neutral-800 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Key
        </button>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 p-4 mb-6 flex items-start gap-3" style={{ border: '1px solid rgba(37,99,235,0.1)' }}>
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-blue-700 leading-relaxed">
          Keys are tried in order of least usage. If a key fails or hits rate limits, the system automatically falls back to the next active key. Keys are auto-disabled after 10 consecutive errors.
        </p>
      </div>

      {/* Add key form */}
      {showAdd && (
        <div className="rounded-2xl bg-white p-6 mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 className="text-[14px] font-bold text-neutral-900 mb-4">Add New API Key</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">Label</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Primary Key"
                className="w-full h-11 rounded-xl bg-neutral-50 px-4 text-[13px] text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900/10"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">API Key</label>
              <input
                type="password"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full h-11 rounded-xl bg-neutral-50 px-4 text-[13px] text-neutral-900 font-mono outline-none focus:ring-2 focus:ring-neutral-900/10"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !newKey.trim()}
              className="h-10 rounded-xl bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all"
            >
              {saving ? 'Adding...' : 'Add Key'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); setNewKey(''); }}
              className="h-10 rounded-xl bg-neutral-100 px-5 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <Key className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-[13px] text-neutral-400">No API keys configured</p>
            <p className="text-[11px] text-neutral-400 mt-1">Using environment variable key as fallback</p>
          </div>
        ) : (
          keys.map((k) => (
            <div
              key={k.id}
              className="rounded-2xl bg-white p-5 flex items-center gap-5 transition-shadow hover:shadow-sm"
              style={{ border: '1px solid rgba(0,0,0,0.06)' }}
            >
              {/* Status dot */}
              <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${k.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold text-neutral-900">{k.name}</p>
                  {k.is_active ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {k.usage_count} uses · {k.error_count} errors · Added {new Date(k.created_at).toLocaleDateString('en-IN')}
                </p>
                {k.last_error && (
                  <p className="text-[10px] text-red-500 mt-1 truncate max-w-md">Last error: {k.last_error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {k.error_count > 0 && (
                  <button
                    onClick={() => handleResetErrors(k.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
                    title="Reset error count"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                )}
                <button
                  onClick={() => handleToggle(k.id, k.is_active)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                    k.is_active ? 'hover:bg-amber-50' : 'hover:bg-emerald-50'
                  }`}
                  title={k.is_active ? 'Disable' : 'Enable'}
                >
                  <Power className={`h-3.5 w-3.5 ${k.is_active ? 'text-amber-500' : 'text-emerald-500'}`} />
                </button>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
