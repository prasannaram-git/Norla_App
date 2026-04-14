import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllUsers } from '@/lib/server-store';

const SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'norla-admin-fallback');
async function isAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  try { await jwtVerify(auth.slice(7), SECRET); return true; } catch { return false; }
}

/** GET — list all users */
export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const users = await getAllUsers();
    return NextResponse.json({
      users: users.map((u, i) => ({
        id: `user-${i}`,
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
