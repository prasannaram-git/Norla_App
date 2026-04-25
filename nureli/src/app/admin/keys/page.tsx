'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Plus, Trash2, Power, RotateCcw, AlertCircle, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';
import { useAdminFetch, adminApiCall } from '../admin-hooks';

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  is_next?: boolean;
  usage_count: number;
  error_count: number;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
}

interface RotationInfo {
  mode: string;
  totalKeys: number;
  activeKeys: number;
  currentPointer: number;
  nextKeyName: string;
}

export default function AdminKeysPage() {
  const router = useRouter();
  const { data, loading, error, refetch } = useAdminFetch<{ keys: ApiKey[]; rotation: RotationInfo }>('/api/admin/keys');
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [bulkKeys, setBulkKeys] = useState('');
  const [saving, setSaving] = useState(false);

  const keys = data?.keys || [];
  const rotation = data?.rotation;

  // Add single key
  const handleAdd = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    await adminApiCall('/api/admin/keys', { method: 'POST', body: { name: newName || 'API Key', api_key: newKey } }, router);
    setNewName('');
    setNewKey('');
    setShowAdd(false);
    setSaving(false);
    refetch();
  };

  // Bulk add keys (one per line)
  const handleBulkAdd = async () => {
    const lines = bulkKeys.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    if (lines.length === 0) return;
    setSaving(true);
    const keysToAdd = lines.map((line, i) => ({ name: `Key ${keys.length + i + 1}`, api_key: line }));
    await adminApiCall('/api/admin/keys', { method: 'POST', body: { keys: keysToAdd } }, router);
    setBulkKeys('');
    setShowBulk(false);
    setSaving(false);
    refetch();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await adminApiCall('/api/admin/keys', { method: 'PUT', body: { id, is_active: !active } }, router);
    refetch();
  };

  const handleResetErrors = async (id: string) => {
    await adminApiCall('/api/admin/keys', { method: 'PUT', body: { id, error_count: 0 } }, router);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this API key?')) return;
    await adminApiCall(`/api/admin/keys?id=${id}`, { method: 'DELETE' }, router);
    refetch();
  };

  const handleResetRotation = async () => {
    await adminApiCall('/api/admin/keys', { method: 'PUT', body: { action: 'reset_rotation' } }, router);
    refetch();
  };

  const handleResetAllErrors = async () => {
    await adminApiCall('/api/admin/keys', { method: 'PUT', body: { action: 'reset_all_errors' } }, router);
    refetch();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">Gemini API Keys</h1>
          <p className="text-[13px] text-neutral-400 mt-1">Serial round-robin rotation across all active keys</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refetch} className="flex items-center gap-2 h-10 rounded-xl bg-white px-3 text-[12px] font-semibold text-neutral-500 hover:bg-neutral-100 transition-all" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => { setShowBulk(true); setShowAdd(false); }} className="flex items-center gap-2 h-10 rounded-xl bg-white px-4 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-100 transition-all" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            Bulk Add
          </button>
          <button onClick={() => { setShowAdd(true); setShowBulk(false); }} className="flex items-center gap-2 h-10 rounded-xl bg-neutral-900 px-4 text-[13px] font-semibold text-white hover:bg-neutral-800 active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" />
            Add Key
          </button>
        </div>
      </div>

      {/* Rotation Status Card */}
      {rotation && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-5 mb-6 flex items-center justify-between" style={{ border: '1px solid rgba(5,150,105,0.12)' }}>
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-neutral-900">Round-Robin Active</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                {rotation.activeKeys} of {rotation.totalKeys} keys active —
                Next scan uses <span className="font-bold text-emerald-700">#{rotation.currentPointer + 1}</span> ({rotation.nextKeyName})
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetAllErrors} className="h-8 rounded-lg bg-white px-3 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-100 transition-all" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
              Reset All Errors
            </button>
            <button onClick={handleResetRotation} className="h-8 rounded-lg bg-white px-3 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 transition-all" style={{ border: '1px solid rgba(5,150,105,0.15)' }}>
              Reset Rotation
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl bg-blue-50 p-4 mb-6 flex items-start gap-3" style={{ border: '1px solid rgba(37,99,235,0.1)' }}>
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-[12px] text-blue-700 leading-relaxed">
          <strong>How rotation works:</strong> Each scan uses the next key in serial order (1→2→3→...→15→1). If a key fails, it automatically tries the next one. Keys are auto-disabled after 10 consecutive errors. Error count resets on successful usage. This distributes load evenly and stays within free tier limits.
        </p>
      </div>

      {/* Single Add form */}
      {showAdd && (
        <div className="rounded-2xl bg-white p-6 mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 className="text-[14px] font-bold text-neutral-900 mb-4">Add Single API Key</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">Label</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Key 1" className="w-full h-11 rounded-xl bg-neutral-50 px-4 text-[13px] text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900/10" style={{ border: '1px solid rgba(0,0,0,0.06)' }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">API Key</label>
              <input type="password" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="AIzaSy..." className="w-full h-11 rounded-xl bg-neutral-50 px-4 text-[13px] text-neutral-900 font-mono outline-none focus:ring-2 focus:ring-neutral-900/10" style={{ border: '1px solid rgba(0,0,0,0.06)' }} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !newKey.trim()} className="h-10 rounded-xl bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all">
              {saving ? 'Adding...' : 'Add Key'}
            </button>
            <button onClick={() => { setShowAdd(false); setNewName(''); setNewKey(''); }} className="h-10 rounded-xl bg-neutral-100 px-5 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bulk Add form */}
      {showBulk && (
        <div className="rounded-2xl bg-white p-6 mb-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 className="text-[14px] font-bold text-neutral-900 mb-1">Bulk Add API Keys</h3>
          <p className="text-[12px] text-neutral-400 mb-4">Paste one API key per line. Duplicates are automatically skipped.</p>
          <textarea
            value={bulkKeys}
            onChange={(e) => setBulkKeys(e.target.value)}
            rows={8}
            placeholder={"AIzaSyA...\nAIzaSyB...\nAIzaSyC...\n(one key per line)"}
            className="w-full rounded-xl bg-neutral-50 px-4 py-3 text-[12px] text-neutral-900 font-mono outline-none focus:ring-2 focus:ring-neutral-900/10 resize-none"
            style={{ border: '1px solid rgba(0,0,0,0.06)' }}
          />
          <p className="text-[11px] text-neutral-400 mt-2 mb-4">
            {bulkKeys.split('\n').filter(l => l.trim().length > 10).length} valid key(s) detected
          </p>
          <div className="flex gap-2">
            <button onClick={handleBulkAdd} disabled={saving || bulkKeys.split('\n').filter(l => l.trim().length > 10).length === 0} className="h-10 rounded-xl bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all">
              {saving ? 'Adding...' : `Add ${bulkKeys.split('\n').filter(l => l.trim().length > 10).length} Key(s)`}
            </button>
            <button onClick={() => { setShowBulk(false); setBulkKeys(''); }} className="h-10 rounded-xl bg-neutral-100 px-5 text-[13px] font-semibold text-neutral-600 hover:bg-neutral-200 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys Table */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <AlertCircle className="h-6 w-6 text-red-400 mx-auto mb-3" />
            <p className="text-[13px] text-neutral-400">{error}</p>
            <button onClick={refetch} className="text-[12px] font-semibold text-neutral-900 hover:underline mt-2">Retry</button>
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            <Key className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-neutral-700">No API keys configured</p>
            <p className="text-[12px] text-neutral-400 mt-1">Add up to 15 Gemini API keys for round-robin rotation</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[32px_1fr_80px_80px_60px_100px] items-center px-5 py-2 text-[9px] font-bold text-neutral-400 uppercase tracking-[0.12em]">
              <span>#</span>
              <span>Key</span>
              <span className="text-center">Uses</span>
              <span className="text-center">Errors</span>
              <span className="text-center">Status</span>
              <span className="text-right">Actions</span>
            </div>

            {keys.map((k, i) => (
              <div
                key={k.id}
                className={`grid grid-cols-[32px_1fr_80px_80px_60px_100px] items-center rounded-xl px-5 py-3.5 transition-all hover:shadow-sm ${
                  k.is_next ? 'bg-emerald-50/60 ring-1 ring-emerald-200/50' : 'bg-white'
                }`}
                style={{ border: k.is_next ? '1px solid rgba(5,150,105,0.15)' : '1px solid rgba(0,0,0,0.04)' }}
              >
                {/* Slot number */}
                <span className={`text-[12px] font-bold tabular-nums ${k.is_next ? 'text-emerald-600' : 'text-neutral-300'}`}>
                  {i + 1}
                </span>

                {/* Name + status */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${k.is_active ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                    <p className="text-[13px] font-semibold text-neutral-900 truncate">{k.name}</p>
                    {k.is_next && (
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase tracking-wider">
                        <ArrowRight className="h-2.5 w-2.5" /> Next
                      </span>
                    )}
                  </div>
                  {k.last_error && <p className="text-[10px] text-red-400 mt-0.5 truncate max-w-[300px]">{k.last_error}</p>}
                </div>

                {/* Uses */}
                <span className="text-[13px] font-semibold tabular-nums text-neutral-700 text-center">{k.usage_count}</span>

                {/* Errors */}
                <span className={`text-[13px] font-semibold tabular-nums text-center ${k.error_count > 0 ? 'text-red-500' : 'text-neutral-300'}`}>
                  {k.error_count}
                </span>

                {/* Status */}
                <div className="flex justify-center">
                  {k.is_active ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-neutral-400" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  {k.error_count > 0 && (
                    <button onClick={() => handleResetErrors(k.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors" title="Reset errors">
                      <RotateCcw className="h-3 w-3 text-neutral-400" />
                    </button>
                  )}
                  <button onClick={() => handleToggle(k.id, k.is_active)} className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${k.is_active ? 'hover:bg-amber-50' : 'hover:bg-emerald-50'}`} title={k.is_active ? 'Disable' : 'Enable'}>
                    <Power className={`h-3 w-3 ${k.is_active ? 'text-amber-500' : 'text-emerald-500'}`} />
                  </button>
                  <button onClick={() => handleDelete(k.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* Footer summary */}
            <div className="px-5 pt-2 text-[11px] text-neutral-400">
              {keys.length} key{keys.length !== 1 ? 's' : ''} total · {keys.filter(k => k.is_active).length} active · Round-robin slot #{(rotation?.currentPointer ?? 0) + 1}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
