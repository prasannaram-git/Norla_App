'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare, Wifi, WifiOff, QrCode, RefreshCw,
  Phone, CheckCircle, XCircle, Loader2, Plus, AlertCircle,
} from 'lucide-react';

interface WASlot {
  slotId: string;
  label: string;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCode: string | null;
  phoneNumber: string | null;
  userName: string | null;
  lastError: string | null;
  messagesSent: number;
}

export default function AdminSettingsPage() {
  const [slots, setSlots] = useState<WASlot[]>([]);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/whatsapp', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.slots) setSlots(data.slots);
        return data.slots as WASlot[];
      }
    } catch { /* ignore */ }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Poll while any slot is connecting/qr_ready
  useEffect(() => {
    const hasActive = slots.some((s) => s.status === 'connecting' || s.status === 'qr_ready');
    if (!hasActive) { setPolling(false); return; }
    setPolling(true);
    const interval = setInterval(async () => {
      const updated = await fetchStatus();
      const stillActive = updated.some((s) => s.status === 'connecting' || s.status === 'qr_ready');
      if (!stillActive) { clearInterval(interval); setPolling(false); }
    }, 3000);
    return () => clearInterval(interval);
  }, [slots, fetchStatus]);

  const handleConnect = async (slotId: string) => {
    setLoadingSlot(slotId);
    try {
      const res = await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'connect', slotId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSlots((prev) => prev.map((s) => s.slotId === slotId ? { ...s, ...data } : s));
      }
    } catch { /* ignore */ }
    setLoadingSlot(null);
  };

  const handleDisconnect = async (slotId: string) => {
    setLoadingSlot(slotId);
    try {
      await fetch('/api/admin/whatsapp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'disconnect', slotId }),
      });
      setSlots((prev) =>
        prev.map((s) => s.slotId === slotId
          ? { ...s, status: 'disconnected', qrCode: null, phoneNumber: null, userName: null, lastError: null }
          : s
        )
      );
    } catch { /* ignore */ }
    setLoadingSlot(null);
  };

  const connectedCount = slots.filter((s) => s.status === 'connected').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-neutral-900 tracking-tight">WhatsApp Slots</h1>
        <p className="text-[13px] text-neutral-400 mt-1">
          Connect up to 5 WhatsApp numbers. OTPs are distributed round-robin across all connected numbers.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-6 rounded-xl bg-white p-4" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${connectedCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-300'}`} />
          <span className="text-[13px] font-semibold text-neutral-700">
            {connectedCount} of 5 numbers connected
          </span>
        </div>
        {connectedCount === 0 && (
          <span className="text-[12px] text-amber-600 font-medium">
            ⚠ OTP delivery is offline — connect at least one number below
          </span>
        )}
        {polling && (
          <div className="flex items-center gap-1.5 ml-auto text-[11px] text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            Waiting for scan...
          </div>
        )}
      </div>

      {/* Slot cards */}
      <div className="grid grid-cols-1 gap-4">
        {slots.map((slot) => (
          <SlotCard
            key={slot.slotId}
            slot={slot}
            loading={loadingSlot === slot.slotId}
            onConnect={() => handleConnect(slot.slotId)}
            onDisconnect={() => handleDisconnect(slot.slotId)}
            onRefresh={() => handleConnect(slot.slotId)}
          />
        ))}
      </div>

      {/* Info box */}
      <div className="mt-6 rounded-xl bg-blue-50 p-4 flex gap-3" style={{ border: '1px solid rgba(37,99,235,0.1)' }}>
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-[12px] text-blue-700 space-y-1">
          <p className="font-semibold">How multi-number OTP works</p>
          <p>Each connected number can send OTPs. When a user requests a code, the system picks the number that has sent the fewest messages (round-robin), preventing any single number from being flagged by WhatsApp.</p>
          <p className="mt-1">Use cheap SIM cards / spare numbers. Recommended: at least 2 numbers for reliability.</p>
        </div>
      </div>

      {/* Test OTP */}
      <div className="mt-6">
        <TestOTPSection headers={headers} connectedCount={connectedCount} />
      </div>
    </div>
  );
}

// ── Slot card ───────────────────────────────────────────────────────
function SlotCard({
  slot, loading, onConnect, onDisconnect, onRefresh,
}: {
  slot: WASlot;
  loading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}) {
  const statusColor = {
    connected: 'bg-emerald-50 text-emerald-600',
    qr_ready: 'bg-amber-50 text-amber-600',
    connecting: 'bg-amber-50 text-amber-600',
    disconnected: 'bg-neutral-100 text-neutral-500',
  }[slot.status];

  const dotColor = {
    connected: 'bg-emerald-500',
    qr_ready: 'bg-amber-500 animate-pulse',
    connecting: 'bg-amber-500 animate-pulse',
    disconnected: 'bg-neutral-400',
  }[slot.status];

  return (
    <div className="rounded-2xl bg-white p-5" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${slot.status === 'connected' ? 'bg-emerald-50' : 'bg-neutral-100'}`}>
            <MessageSquare className={`h-4.5 w-4.5 ${slot.status === 'connected' ? 'text-emerald-600' : 'text-neutral-400'}`} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-neutral-900">{slot.label}</p>
            {slot.phoneNumber && (
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-0.5">
                <Phone className="h-3 w-3" />
                <span>+{slot.phoneNumber}</span>
                {slot.userName && <span>({slot.userName})</span>}
              </div>
            )}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
          <div className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          {slot.status === 'connected' ? 'Connected' :
           slot.status === 'qr_ready' ? 'Scan QR' :
           slot.status === 'connecting' ? 'Connecting' : 'Offline'}
        </div>
      </div>

      {/* Error */}
      {slot.lastError && slot.status === 'disconnected' && (
        <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3" style={{ border: '1px solid rgba(220,38,38,0.08)' }}>
          <XCircle className="h-3 w-3 shrink-0" />
          {slot.lastError}
        </div>
      )}

      {/* QR Code */}
      {slot.status === 'qr_ready' && slot.qrCode && (
        <div className="flex flex-col items-center py-4">
          <div className="inline-block rounded-xl bg-white p-2 mb-2" style={{ border: '2px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <img src={slot.qrCode} alt="WhatsApp QR Code" className="w-[180px] h-[180px]" style={{ imageRendering: 'pixelated' }} />
          </div>
          <p className="text-[11px] text-neutral-500 mb-2">Open WhatsApp → Settings → Linked Devices → Link a Device</p>
          <button onClick={onRefresh} className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-600">
            <RefreshCw className="h-3 w-3" /> Refresh QR
          </button>
        </div>
      )}

      {slot.status === 'connecting' && !slot.qrCode && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 text-neutral-300 animate-spin mr-2" />
          <p className="text-[12px] text-neutral-400">Generating QR code...</p>
        </div>
      )}

      {/* Connected info */}
      {slot.status === 'connected' && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50/60 rounded-lg px-3 py-2 mb-3" style={{ border: '1px solid rgba(5,150,105,0.1)' }}>
          <CheckCircle className="h-3 w-3" />
          Ready to send OTPs · {slot.messagesSent} sent this session
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {slot.status === 'disconnected' && (
          <button
            onClick={onConnect}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-xl bg-neutral-900 px-4 text-[12px] font-semibold text-white hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Connecting...</> : <><Plus className="h-3.5 w-3.5" /> Connect</>}
          </button>
        )}
        {(slot.status === 'qr_ready' || slot.status === 'connecting') && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-xl bg-amber-50 border border-amber-200 px-4 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh QR
          </button>
        )}
        {slot.status === 'connected' && (
          <button
            onClick={onDisconnect}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 rounded-xl bg-red-50 px-4 text-[12px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
            style={{ border: '1px solid rgba(220,38,38,0.12)' }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WifiOff className="h-3.5 w-3.5" />}
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

// ── Test OTP section ────────────────────────────────────────────────
function TestOTPSection({ headers, connectedCount }: { headers: Record<string, string>; connectedCount: number }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleTest = async () => {
    if (!phone) return;
    setSending(true);
    setStatus('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(
          data.dev_code
            ? `Dev mode — Code: ${data.dev_code} (WhatsApp not connected)`
            : '✅ OTP sent via WhatsApp successfully'
        );
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch {
      setStatus('Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      <h2 className="text-[14px] font-bold text-neutral-900 mb-1">Test OTP Delivery</h2>
      <p className="text-[12px] text-neutral-400 mb-4">
        {connectedCount > 0
          ? `OTP will be sent via one of your ${connectedCount} connected number(s).`
          : 'Connect at least one WhatsApp number above first.'}
      </p>
      <div className="flex gap-2 max-w-md">
        <div className="flex h-11 items-center justify-center rounded-xl bg-neutral-50 px-3 text-[13px] font-semibold text-neutral-500 shrink-0" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
          +91
        </div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
          placeholder="Phone number"
          className="flex-1 h-11 rounded-xl bg-neutral-50 px-4 text-[13px] text-neutral-900 outline-none focus:ring-2 focus:ring-neutral-900/10"
          style={{ border: '1px solid rgba(0,0,0,0.06)' }}
        />
        <button
          onClick={handleTest}
          disabled={sending || phone.length < 10}
          className="h-11 rounded-xl bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 transition-all"
        >
          {sending ? 'Sending...' : 'Send Test'}
        </button>
      </div>
      {status && (
        <p className={`text-[12px] mt-3 font-medium ${
          status.startsWith('Error') ? 'text-red-600' :
          status.includes('Dev') ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {status}
        </p>
      )}
    </div>
  );
}
