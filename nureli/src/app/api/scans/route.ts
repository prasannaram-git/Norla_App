import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/scans — Fetch user's scan history from Supabase
 * 
 * Authenticated via Bearer token (same HMAC session token from OTP verify).
 * Returns all scans for the user, ordered by newest first.
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and verify session token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const phone = await verifySessionToken(token);
    if (!phone) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Fetch scans from Supabase
    const supabase = createClient();
    if (!supabase) {
      return NextResponse.json({ scans: [] }); // No DB configured
    }

    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_phone', phone)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Scans API] Supabase error:', error);
      return NextResponse.json({ scans: [] });
    }

    return NextResponse.json({ scans: scans || [] });
  } catch (err) {
    console.error('[Scans API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}
