import { NextRequest, NextResponse } from 'next/server';
import { generateOTP } from '@/lib/otp';
import { logActivity } from '@/lib/server-store';

// ── In-memory rate limiter ────────────────────────────────────────
// Max 3 OTPs per phone number per 10 minutes
declare global {
  // eslint-disable-next-line no-var
  var __otpRateLimit: Map<string, { count: number; resetAt: number }> | undefined;
}
function getRateLimitMap() {
  if (!global.__otpRateLimit) global.__otpRateLimit = new Map();
  return global.__otpRateLimit;
}

function checkRateLimit(phone: string): { allowed: boolean; waitSeconds?: number } {
  const map = getRateLimitMap();
  const now = Date.now();
  const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const MAX_PER_WINDOW = 3;

  const entry = map.get(phone);
  if (entry && entry.resetAt > now) {
    if (entry.count >= MAX_PER_WINDOW) {
      return { allowed: false, waitSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }
    entry.count += 1;
    map.set(phone, entry);
  } else {
    map.set(phone, { count: 1, resetAt: now + WINDOW_MS });
  }
  return { allowed: true };
}

// ── Route handler ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 });
    }

    const formatted = phone.startsWith('+') ? phone : `+91${String(phone).replace(/\D/g, '')}`;

    // Rate limit check
    const rateCheck = checkRateLimit(formatted);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please wait ${Math.ceil((rateCheck.waitSeconds ?? 600) / 60)} minute(s) before requesting another code.`,
          retryAfterSeconds: rateCheck.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Generate OTP
    const code = await generateOTP(formatted);

    // Try to send via WhatsApp Web (Baileys) — all connected slots, round-robin
    let sent = false;
    let method = 'unavailable';

    try {
      const { sendOTPViaWhatsApp, autoRestoreSessions } = await import('@/lib/whatsapp-web');
      // Ensure sessions are restored on first call
      await autoRestoreSessions();
      sent = await sendOTPViaWhatsApp(formatted, code);
      method = sent ? 'whatsapp_web' : 'unavailable';
    } catch {
      // WhatsApp Web module may not be available in some environments
    }

    // Fallback: WhatsApp Cloud API (Meta Business Platform)
    if (!sent) {
      try {
        const { sendWhatsAppOTP } = await import('@/lib/whatsapp');
        sent = await sendWhatsAppOTP(formatted, code);
        if (sent) method = 'whatsapp_cloud';
      } catch {
        // Cloud API not configured
      }
    }

    // Log activity
    await logActivity('otp_sent', formatted, { method, sent: String(sent) });

    if (sent) {
      return NextResponse.json({ success: true, method: 'whatsapp' });
    }

    // WhatsApp not connected / not available
    // In DEVELOPMENT only: show the code in the response for local testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP DEV] ${formatted}: ${code}`);
      await logActivity('otp_sent', formatted, { method: 'dev', code });
      return NextResponse.json({
        success: true,
        method: 'dev',
        dev_code: code, // Only visible in dev, never in production
      });
    }

    // Production + WhatsApp not connected → proper error (no code in response!)
    return NextResponse.json(
      {
        error: 'OTP service is temporarily unavailable. Please contact support or try again in a few minutes.',
        method: 'unavailable',
      },
      { status: 503 }
    );
  } catch (err: unknown) {
    console.error('[OTP Send Error]', err);
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
