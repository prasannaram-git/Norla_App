import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getStats } from '@/lib/server-store';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'norla-admin-fallback');

async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try { await jwtVerify(auth.slice(7), SECRET); return true; } catch { return false; }
}

/** GET /api/admin/stats — Dashboard statistics */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getStats();
    return NextResponse.json(stats);
  } catch (err: unknown) {
    console.error('[Admin Stats Error]', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
