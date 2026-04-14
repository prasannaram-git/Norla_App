import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPCode } from '@/lib/otp';
import { logActivity, upsertUser } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code required' }, { status: 400 });
    }

    const formatted = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`;
    const valid = await verifyOTPCode(formatted, code);

    if (!valid) {
      await logActivity('otp_failed', formatted, { code });
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }

    // Log successful verification
    await logActivity('otp_verified', formatted, { status: 'success' });

    // Create/update user in server store (name will be updated later via sync)
    await upsertUser({ phone: formatted, name: '', dob: '', sex: '' });

    // Set auth session cookie so middleware allows access to protected routes
    const response = NextResponse.json({ success: true, phone: formatted });
    response.cookies.set('norla_session', formatted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    console.error('[OTP Verify Error]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
