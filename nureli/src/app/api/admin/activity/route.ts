import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getActivityLog } from '@/lib/server-store';

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const activity = await getActivityLog();
    return NextResponse.json({ activity });
  } catch (err: unknown) {
    console.error('[Admin Activity Error]', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
