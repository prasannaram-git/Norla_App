import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * DELETE /api/user/delete
 *
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * Google Play Store and Apple App Store both REQUIRE that apps collecting
 * personal data provide a way for users to request account deletion.
 *
 * This endpoint:
 * 1. Reads the user's phone from their session cookie
 * 2. Deletes all their scans, OTP codes, and activity logs
 * 3. Deletes their user record
 * 4. Clears the session cookie
 */
export async function DELETE(req: NextRequest) {
  // Get session info from cookie
  const sessionCookie = req.cookies.get('norla_session');
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let userPhone: string;
  try {
    const session = JSON.parse(sessionCookie.value);
    userPhone = session.phone;
    if (!userPhone) throw new Error('No phone in session');
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Delete all user data in correct order (FK constraints)
    await supabase.from('otp_codes').delete().eq('phone', userPhone);
    await supabase.from('activity_log').delete().eq('user_phone', userPhone);
    await supabase.from('scans').delete().eq('user_phone', userPhone);
    await supabase.from('users').delete().eq('phone', userPhone);

    // Clear the session cookie
    const response = NextResponse.json({ success: true, message: 'Account deleted successfully.' });
    response.cookies.set('norla_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // Immediately expire
      path: '/',
    });

    console.log(`[User Delete] Account deleted for ${userPhone}`);
    return response;
  } catch (err) {
    console.error('[User Delete Error]', err);
    return NextResponse.json({ error: 'Failed to delete account. Please try again.' }, { status: 500 });
  }
}
