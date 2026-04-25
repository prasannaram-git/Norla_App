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
  reconnectTimer: ReturnType<typeof setTimeout> | null;
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
        reconnectTimer: null,
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

  // Clear any pending reconnect
  if (slot.reconnectTimer) {
    clearTimeout(slot.reconnectTimer);
    slot.reconnectTimer = null;
  }

  // Disconnect existing socket if any
  if (slot.socket) {
    try { slot.socket.end(undefined); } catch { /* ignore */ }
    slot.socket = null;
  }

  slot.status = 'connecting';
  slot.qrCode = null;
  slot.lastError = null;
  slots.set(slotId, slot);

  console.log(`[WhatsApp] Connecting ${slotId}...`);

  try {
    const baileys = await import('@whiskeysockets/baileys');
    const makeWASocket = baileys.default;
    const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = baileys;

    const authDir = getAuthDir(slotId);
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[WhatsApp] ${slotId} using Baileys version ${version.join('.')}`);

    // Baileys requires a pino-compatible logger. We create a recursive no-op logger
    // so that logger.child().child().trace() etc. all work without crashing.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noopLogger: any = {
      level: 'silent',
      fatal: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
      trace: () => {},
      child: () => noopLogger, // Return itself so child loggers also have all methods
    };

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: noopLogger,
      browser: Browsers.ubuntu('Chrome'),
      // Increase timeout for slow servers
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: undefined,
      qrTimeout: 60000,
    });

    slot.socket = sock;
    slots.set(slotId, slot);

    // QR code event
    sock.ev.on('connection.update', async (update: { connection?: string; lastDisconnect?: { error?: Error }; qr?: string }) => {
      const { connection, lastDisconnect, qr } = update;
      const currentSlot = slots.get(slotId)!;

      console.log(`[WhatsApp] ${slotId} connection.update:`, { connection, hasQR: !!qr, hasError: !!lastDisconnect?.error });

      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
          currentSlot.qrCode = qrDataUrl;
          currentSlot.status = 'qr_ready';
          currentSlot.lastError = null;
          console.log(`[WhatsApp] ${slotId} QR code generated successfully`);
        } catch (qrErr) {
          console.error(`[WhatsApp] ${slotId} QR generation failed:`, qrErr);
          currentSlot.qrCode = null;
          currentSlot.lastError = `QR generation failed: ${qrErr instanceof Error ? qrErr.message : 'Unknown'}`;
        }
        slots.set(slotId, currentSlot);
      }

      if (connection === 'close') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorObj = lastDisconnect?.error as any;
        const statusCode = errorObj?.output?.statusCode;
        const errMsg = errorObj?.message || errorObj?.toString() || 'Unknown';

        console.log(`[WhatsApp] ${slotId} disconnected: code=${statusCode}, msg=${errMsg}`);

        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        currentSlot.socket = null;
        currentSlot.qrCode = null;

        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          // Logged out — wipe auth and stop
          currentSlot.status = 'disconnected';
          currentSlot.phoneNumber = null;
          currentSlot.userName = null;
          currentSlot.lastError = 'Logged out. Click Connect to scan a new QR code.';
          try { fs.rmSync(getAuthDir(slotId), { recursive: true, force: true }); } catch { /* ignore */ }
          slots.set(slotId, currentSlot);
        } else if (shouldReconnect) {
          // Auto-reconnect after 10 seconds (not too aggressive)
          currentSlot.status = 'connecting';
          currentSlot.lastError = `Reconnecting... (code ${statusCode}: ${errMsg})`;
          slots.set(slotId, currentSlot);
          currentSlot.reconnectTimer = setTimeout(() => {
            currentSlot.reconnectTimer = null;
            connectWhatsAppSlot(slotId).catch(() => {});
          }, 10000);
        } else {
          currentSlot.status = 'disconnected';
          currentSlot.phoneNumber = null;
          currentSlot.userName = null;
          currentSlot.lastError = `Connection closed (${statusCode}: ${errMsg})`;
          slots.set(slotId, currentSlot);
        }
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
    console.error(`[WhatsApp] Slot ${slotId} failed to initialize:`, err);
    slot.status = 'disconnected';
    slot.lastError = `Init failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
    slot.socket = null;
    slots.set(slotId, slot);
  }
}

// ── Disconnect a single slot ───────────────────────────────────────
export async function disconnectWhatsAppSlot(slotId: string): Promise<void> {
  const slots = getSlots();
  const slot = slots.get(slotId);
  if (!slot) return;

  // Clear reconnect timer
  if (slot.reconnectTimer) {
    clearTimeout(slot.reconnectTimer);
    slot.reconnectTimer = null;
  }

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
export function getWhatsAppSlotStatus(slotId: string): Omit<WASlot, 'socket' | 'reconnectTimer'> {
  const slots = getSlots();
  const slot = slots.get(slotId) ?? {
    slotId, label: slotId, status: 'disconnected' as ConnectionStatus,
    qrCode: null, phoneNumber: null, userName: null, lastError: null,
    messagesSent: 0, socket: null, reconnectTimer: null,
  };
  // Never expose internal objects to callers
  const { socket: _socket, reconnectTimer: _timer, ...safe } = slot;
  void _socket;
  void _timer;
  return safe;
}

// ── Get status of all slots ────────────────────────────────────────
export function getAllSlotStatuses(): Omit<WASlot, 'socket' | 'reconnectTimer'>[] {
  const slots = getSlots();
  return Array.from(slots.values()).map(({ socket: _s, reconnectTimer: _t, ...safe }) => { void _s; void _t; return safe; });
}

// ── Legacy single-slot status ─────────────────────────────────────
export function getWhatsAppStatus(): Omit<WASlot, 'socket' | 'reconnectTimer'> {
  return getWhatsAppSlotStatus('slot-1');
}

// ── Auto-restore sessions from auth directories on startup ────────
declare global {
  // eslint-disable-next-line no-var
  var __waAutoRestored: boolean | undefined;
}

export async function autoRestoreSessions(): Promise<void> {
  // Use global flag so it persists across HMR module reloads in dev
  if (global.__waAutoRestored) return;
  global.__waAutoRestored = true;

  if (!fs.existsSync(AUTH_BASE_DIR)) {
    console.log('[WhatsApp] No auth directory found — nothing to restore');
    return;
  }

  let restored = 0;
  for (let i = 1; i <= MAX_SLOTS; i++) {
    const slotId = `slot-${i}`;
    const authDir = path.join(AUTH_BASE_DIR, slotId);
    // Only reconnect if auth files exist (user previously scanned QR)
    if (fs.existsSync(path.join(authDir, 'creds.json'))) {
      console.log(`[WhatsApp] Auto-restoring ${slotId}...`);
      restored++;
      connectWhatsAppSlot(slotId).catch((err) => {
        console.error(`[WhatsApp] Auto-restore failed for ${slotId}:`, err);
      });
    }
  }

  if (restored === 0) {
    console.log('[WhatsApp] No saved sessions found to restore');
  } else {
    console.log(`[WhatsApp] Auto-restore initiated for ${restored} slot(s)`);
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
