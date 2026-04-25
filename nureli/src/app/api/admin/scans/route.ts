import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getAllScans } from '@/lib/server-store';

/** GET — list all scans */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const scans = await getAllScans();
    return NextResponse.json({
      scans: scans.map((s) => ({
        id: s.id,
        user_id: s.userId,
        user_phone: s.userPhone || '',
        status: s.status,
        overall_balance_score: s.overallBalanceScore ?? null,
        created_at: s.createdAt,
      })),
    });
  } catch (err: unknown) {
    console.error('[Admin Scans Error]', err);
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}
