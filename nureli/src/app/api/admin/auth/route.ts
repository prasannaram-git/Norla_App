import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { getAdminSecret } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const validUser = process.env.ADMIN_USERNAME || 'admin';
    const validPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== validUser || password !== validPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await new SignJWT({ role: 'admin', username })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(getAdminSecret());

    return NextResponse.json({ token });
  } catch (err: unknown) {
    console.error('[Admin Auth Error]', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
