import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { getAllUsers } from '@/lib/server-store';

/** GET — list all users with stable IDs based on phone number */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await getAllUsers();
    return NextResponse.json({
      users: users.map((u) => ({
        // Use phone as stable ID (it's unique and won't change on re-sort)
        id: u.phone || `anon-${Math.random().toString(36).slice(2, 8)}`,
        phone: u.phone,
        name: u.name,
        dob: u.dob,
        sex: u.sex,
        created_at: u.createdAt,
        last_login_at: u.lastLoginAt,
      })),
    });
  } catch (err: unknown) {
    console.error('[Admin Users Error]', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
