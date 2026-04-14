import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET && process.env.ADMIN_JWT_SECRET !== 'norla-admin-fallback'
    ? process.env.ADMIN_JWT_SECRET
    : 'norla-admin-fallback'
);

async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try {
    await jwtVerify(auth.slice(7), SECRET);
    return true;
  } catch {
    return false;
  }
}

/** GET — return status of all WhatsApp slots */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { getAllSlotStatuses } = await import('@/lib/whatsapp-web');
    const slots = getAllSlotStatuses();
    return NextResponse.json({ slots });
  } catch (err) {
    console.error('[Admin WhatsApp GET Error]', err);
    // WhatsApp module unavailable in some environments
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
      // Start the connection (non-blocking — QR arrives asynchronously)
      connectWhatsAppSlot(slotId).catch((err) => {
        console.error(`[WhatsApp] Connect error for ${slotId}:`, err);
      });
      
      // Wait up to 8 seconds for QR code to appear
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
