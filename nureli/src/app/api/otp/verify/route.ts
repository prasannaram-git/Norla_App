import { NextRequest, NextResponse } from 'next/server';
import { verifyOTPCode } from '@/lib/otp';
import { logActivity, upsertUser, getAllUsers } from '@/lib/server-store';
import { createSessionToken } from '@/lib/session';

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

    // Check if this is a returning user (already has name/dob/sex in server store)
    let existingProfile: { name: string; dob: string; sex: string; phone: string } | null = null;
    try {
      const allUsers = await getAllUsers();
      const found = allUsers.find((u) => u.phone === formatted);
      if (found && found.name) {
        existingProfile = {
          phone: found.phone,
          name: found.name,
          dob: found.dob || '',
          sex: found.sex || '',
        };
      }
    } catch { /* ignore */ }

    // Only upsert if user doesn't exist yet (don't overwrite existing profile with blanks)
    if (!existingProfile) {
      await upsertUser({ phone: formatted, name: '', dob: '', sex: '' });
    } else {
      // Just update last_login_at without touching profile fields
      await upsertUser({
        phone: formatted,
        name: existingProfile.name,
        dob: existingProfile.dob,
        sex: existingProfile.sex,
      });
    }

    // Set HMAC-signed session cookie (prevents forgery — can't impersonate other users)
    const sessionToken = await createSessionToken(formatted);
    const response = NextResponse.json({
      success: true,
      phone: formatted,
      // Session token for React Native app (can't read HTTP-only cookies)
      sessionToken,
      // Return existing profile so client can skip onboarding for returning users
      // This is the SERVER source of truth — works even if localStorage was cleared
      profile: existingProfile,
    });
    response.cookies.set('norla_session', sessionToken, {
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
