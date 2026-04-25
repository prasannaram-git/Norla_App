import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getAllUsers, getAllScans } from '@/lib/server-store';

/**
 * GET /api/user/me — Returns current user's profile + scan history from Supabase.
 * 
 * This is the SERVER source of truth for user data. Works on any device,
 * any browser, even after clearing localStorage. The client uses this to
 * hydrate the UI and merge with local cache.
 * 
 * Auth: Reads phone from HMAC-signed `norla_session` cookie.
 */
export async function GET(req: NextRequest) {
  try {
    // Extract phone from session cookie
    const sessionCookie = req.cookies.get('norla_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const phone = await verifySessionToken(sessionCookie);
    if (!phone) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user profile from server store (Supabase → file fallback)
    let profile: { name: string; phone: string; dob: string; sex: string } | null = null;
    try {
      const allUsers = await getAllUsers();
      const found = allUsers.find((u) => u.phone === phone);
      if (found && found.name) {
        profile = {
          phone: found.phone,
          name: found.name,
          dob: found.dob || '',
          sex: found.sex || '',
        };
      }
    } catch { /* ignore */ }

    // Get user's scans from server store (filtered by phone)
    let scans: Array<{
      id: string;
      userId: string;
      userPhone?: string;
      status: string;
      overallBalanceScore?: number;
      nutrientScores?: Record<string, unknown>;
      focusAreas?: unknown[];
      recommendations?: unknown[];
      confidenceNote?: string;
      createdAt: string;
    }> = [];
    try {
      const allScans = await getAllScans();
      // Filter scans by this user's phone number
      scans = allScans.filter((s) => {
        // Match by userPhone field
        if (s.userPhone === phone) return true;
        // Match by userId containing the phone (e.g. "phone-+918050104296")
        if (s.userId?.includes(phone.replace('+', ''))) return true;
        return false;
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      profile,
      scans,
      phone,
    });
  } catch (err) {
    console.error('[User/Me] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
