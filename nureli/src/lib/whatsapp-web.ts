/**
 * Norla — Multi-Slot WhatsApp Web Integration (Baileys)
 *
 * Supports up to 5 WhatsApp numbers simultaneously.
 * OTPs are distributed round-robin across connected slots.
 * Each slot has its own auth directory and independent connection.
 *
 * Zero-cost OTP delivery: no paid SMS gateway required.
 */

import path from 'path';
import fs from 'fs';
import qrcode from 'qrcode';

const MAX_SLOTS = 5;
const AUTH_BASE_DIR = path.join(process.cwd(), '.whatsapp-auth');

export type ConnectionStatus = 'disconnected' | 'connecting' | 'qr_ready' | 'connected';

export interface WASlot {
  slotId: string;          // 'slot-1' ... 'slot-5'
  label: string;           // Human label e.g. "Number 1"
  status: ConnectionStatus;
  qrCode: string | null;   // base64 data URL for QR
  phoneNumber: string | null;
  userName: string | null;
  lastError: string | null;
  messagesSent: number;    // for round-robin: use least-used first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket: any | null;      // Baileys WASocket instance
}

// ── Global singleton state ─────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __waSlots: Map<string, WASlot> | undefined;
}

function getSlots(): Map<string, WASlot> {
  if (!global.__waSlots) {
    global.__waSlots = new Map();
    // Initialise all slot stubs
    for (let i = 1; i <= MAX_SLOTS; i++) {
      const slotId = `slot-${i}`;
      global.__waSlots.set(slotId, {
        slotId,
        label: `Number ${i}`,
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        userName: null,
        lastError: null,
        messagesSent: 0,
        socket: null,
      });
    }
  }
  return global.__waSlots;
}

// ── Auth directory helpers ─────────────────────────────────────────
function getAuthDir(slotId: string): string {
  const dir = path.join(AUTH_BASE_DIR, slotId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ── Connect a single slot ──────────────────────────────────────────
export async function connectWhatsAppSlot(slotId: string): Promise<void> {
  const slots = getSlots();
  const slot = slots.get(slotId);
  if (!slot) throw new Error(`Unknown slot: ${slotId}`);

  // Disconnect existing socket if any
  if (slot.socket) {
    try { slot.socket.end(undefined); } catch { /* ignore */ }
    slot.socket = null;
  }

  slot.status = 'connecting';
  slot.qrCode = null;
  slot.lastError = null;
  slots.set(slotId, slot);

  try {
    const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } =
      await import('@whiskeysockets/baileys');

    const authDir = getAuthDir(slotId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      logger: { level: 'silent', fatal: () => {}, error: () => {}, warn: () => {}, info: () => {}, debug: () => {}, trace: () => {}, child: () => ({} as any) } as any,
      browser: Browsers.ubuntu('Chrome'),
    });

    slot.socket = sock;
    slots.set(slotId, slot);

    // QR code event
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const currentSlot = slots.get(slotId)!;

      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
          currentSlot.qrCode = qrDataUrl;
          currentSlot.status = 'qr_ready';
        } catch {
          currentSlot.qrCode = null;
        }
        slots.set(slotId, currentSlot);
      }

      if (connection === 'close') {
        const errorObj = lastDisconnect?.error as any;
        const statusCode = errorObj?.output?.statusCode;
        const errMsg = errorObj?.message || 'Unknown Error';
        
        const { Boom } = await import('@hapi/boom');
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        currentSlot.status = 'disconnected';
        currentSlot.socket = null;
        currentSlot.phoneNumber = null;
        currentSlot.userName = null;

        if (shouldReconnect && statusCode !== 401) {
          // Auto-reconnect after 5 seconds
          currentSlot.lastError = `Disconnected (code ${statusCode}: ${errMsg}) — reconnecting...`;
          slots.set(slotId, currentSlot);
          setTimeout(() => connectWhatsAppSlot(slotId).catch(() => {}), 5000);
        } else {
          currentSlot.lastError = statusCode === DisconnectReason.loggedOut
            ? 'Logged out. Please reconnect and scan QR again.'
            : `Connection closed (${statusCode})`;
          // If logged out, wipe auth files so fresh QR is generated next time
          if (statusCode === DisconnectReason.loggedOut) {
            try { fs.rmSync(getAuthDir(slotId), { recursive: true, force: true }); } catch { /* ignore */ }
          }
          slots.set(slotId, currentSlot);
        }
        void Boom; // prevent unused import warning
      }

      if (connection === 'open') {
        currentSlot.status = 'connected';
        currentSlot.qrCode = null;
        currentSlot.lastError = null;
        // Phone number comes from auth state creds
        try {
          const me = sock.user;
          if (me) {
            currentSlot.phoneNumber = me.id.split(':')[0].split('@')[0] || null;
            currentSlot.userName = me.name || null;
          }
        } catch { /* ignore */ }
        slots.set(slotId, currentSlot);
        console.log(`[WhatsApp] Slot ${slotId} connected: ${currentSlot.phoneNumber}`);
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (err) {
    slot.status = 'disconnected';
    slot.lastError = err instanceof Error ? err.message : 'Connection failed';
    slot.socket = null;
    slots.set(slotId, slot);
    console.error(`[WhatsApp] Slot ${slotId} failed:`, err);
  }
}

// ── Disconnect a single slot ───────────────────────────────────────
export async function disconnectWhatsAppSlot(slotId: string): Promise<void> {
  const slots = getSlots();
  const slot = slots.get(slotId);
  if (!slot) return;
  if (slot.socket) {
    try { slot.socket.end(undefined); } catch { /* ignore */ }
    slot.socket = null;
  }
  // Clear auth so next connect starts fresh
  try { fs.rmSync(getAuthDir(slotId), { recursive: true, force: true }); } catch { /* ignore */ }

  slot.status = 'disconnected';
  slot.qrCode = null;
  slot.phoneNumber = null;
  slot.userName = null;
  slot.lastError = null;
  slot.messagesSent = 0;
  slots.set(slotId, slot);
}

// ── Legacy single-slot compatibility (slot-1) ─────────────────────
export async function connectWhatsApp(): Promise<void> {
  return connectWhatsAppSlot('slot-1');
}

export async function disconnectWhatsApp(): Promise<void> {
  return disconnectWhatsAppSlot('slot-1');
}

// ── Get status of a single slot ────────────────────────────────────
export function getWhatsAppSlotStatus(slotId: string): Omit<WASlot, 'socket'> {
  const slots = getSlots();
  const slot = slots.get(slotId) ?? {
    slotId, label: slotId, status: 'disconnected' as ConnectionStatus,
    qrCode: null, phoneNumber: null, userName: null, lastError: null,
    messagesSent: 0, socket: null,
  };
  // Never expose the socket object to callers
  const { socket: _socket, ...safe } = slot;
  void _socket;
  return safe;
}

// ── Get status of all slots ────────────────────────────────────────
export function getAllSlotStatuses(): Omit<WASlot, 'socket'>[] {
  const slots = getSlots();
  return Array.from(slots.values()).map(({ socket: _s, ...safe }) => { void _s; return safe; });
}

// ── Legacy single-slot status ─────────────────────────────────────
export function getWhatsAppStatus(): Omit<WASlot, 'socket'> {
  return getWhatsAppSlotStatus('slot-1');
}

// ── Auto-restore sessions from auth directories on startup ────────
let _autoRestored = false;
export async function autoRestoreSessions(): Promise<void> {
  if (_autoRestored) return;
  _autoRestored = true;
  if (!fs.existsSync(AUTH_BASE_DIR)) return;

  for (let i = 1; i <= MAX_SLOTS; i++) {
    const slotId = `slot-${i}`;
    const authDir = path.join(AUTH_BASE_DIR, slotId);
    // Only reconnect if auth files exist (user previously scanned QR)
    if (fs.existsSync(path.join(authDir, 'creds.json'))) {
      console.log(`[WhatsApp] Auto-restoring ${slotId}...`);
      connectWhatsAppSlot(slotId).catch((err) => {
        console.error(`[WhatsApp] Auto-restore failed for ${slotId}:`, err);
      });
    }
  }
}

// ── Round-robin OTP sending (tries all connected slots) ───────────
export async function sendOTPViaWhatsApp(phoneNumber: string, code: string): Promise<boolean> {
  // Trigger auto-restore on first use (no-op if already done)
  autoRestoreSessions().catch(() => {});

  const slots = getSlots();
  const connected = Array.from(slots.values())
    .filter((s) => s.status === 'connected' && s.socket)
    .sort((a, b) => a.messagesSent - b.messagesSent); // least-used first

  if (connected.length === 0) {
    console.warn('[WhatsApp] No connected slots available for OTP');
    return false;
  }

  const message = `Your Norla verification code is: *${code}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`;
  const jid = `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`;

  // Try each slot in order until one succeeds
  for (const slot of connected) {
    try {
      await slot.socket.sendMessage(jid, { text: message });
      slot.messagesSent += 1;
      slots.set(slot.slotId, slot);
      console.log(`[WhatsApp] OTP sent via ${slot.slotId} (${slot.phoneNumber}) to ${phoneNumber}`);
      return true;
    } catch (err) {
      console.error(`[WhatsApp] Slot ${slot.slotId} failed to send:`, err);
      // Continue to next slot
    }
  }

  console.error('[WhatsApp] All slots failed to send OTP');
  return false;
}
