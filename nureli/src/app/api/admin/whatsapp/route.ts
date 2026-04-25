import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';

/** GET — return status of all WhatsApp slots + trigger auto-restore */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { getAllSlotStatuses, autoRestoreSessions } = await import('@/lib/whatsapp-web');
    // Trigger auto-restore on first admin panel visit (idempotent — no-op if already done)
    autoRestoreSessions().catch(() => {});
    const slots = getAllSlotStatuses();
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('[Admin WhatsApp GET Error]', err);
    return NextResponse.json({
      slots: Array.from({ length: 5 }, (_, i) => ({
        slotId: `slot-${i + 1}`,
        label: `Number ${i + 1}`,
        status: 'disconnected',
        qrCode: null,
        phoneNumber: null,
        userName: null,
        lastError: `WhatsApp module error: ${err instanceof Error ? err.message : 'Unknown'}`,
        messagesSent: 0,
      })),
    });
  }
}

/** POST — connect, disconnect, or refresh a specific slot */
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, slotId = 'slot-1' } = await req.json();

  try {
    const { connectWhatsAppSlot, disconnectWhatsAppSlot, getWhatsAppSlotStatus } =
      await import('@/lib/whatsapp-web');

    if (action === 'connect') {
      connectWhatsAppSlot(slotId).catch((err) => {
        console.error(`[WhatsApp] Connect error for ${slotId}:`, err);
      });
      
      let status = getWhatsAppSlotStatus(slotId);
      for (let i = 0; i < 16; i++) {
        if (status.status === 'qr_ready' || status.status === 'connected') break;
        await new Promise((r) => setTimeout(r, 500));
        status = getWhatsAppSlotStatus(slotId);
      }
      
      return NextResponse.json(status);
    }

    if (action === 'disconnect') {
      await disconnectWhatsAppSlot(slotId);
      const status = getWhatsAppSlotStatus(slotId);
      return NextResponse.json(status);
    }

    return NextResponse.json({ error: 'Invalid action. Use "connect" or "disconnect".' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[Admin WhatsApp Error]', err);
    return NextResponse.json({ 
      error: `WhatsApp operation failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
