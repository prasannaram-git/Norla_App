import { NextRequest, NextResponse } from 'next/server';
import { upsertUser, addScan, logActivity } from '@/lib/server-store';

/**
 * POST /api/sync — Client pushes data to server store (Supabase)
 * Called after login (user data) and after scan completion (scan data)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (type === 'user') {
      // Sync user profile to Supabase
      if (data?.phone && data?.name) {
        await upsertUser({
          phone: data.phone,
          name: data.name,
          dob: data.dob || '',
          sex: data.sex || '',
        });
        await logActivity('user_login', data.phone, { name: data.name });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
    }

    if (type === 'scan') {
      // Sync scan result to Supabase
      if (data?.id) {
        await addScan({
          id: data.id,
          userId: data.userId || 'anonymous',
          userPhone: data.userPhone || '',
          status: data.status || 'completed',
          overallBalanceScore: data.overallBalanceScore,
          nutrientScores: data.nutrientScores,
          focusAreas: data.focusAreas,
          recommendations: data.recommendations,
          confidenceNote: data.confidenceNote,
          createdAt: data.createdAt || new Date().toISOString(),
        });
        await logActivity('scan_completed', data.userPhone || '', {
          scan_id: data.id,
          score: String(data.overallBalanceScore ?? ''),
        });
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Missing scan data' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid sync type' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[Sync Error]', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
