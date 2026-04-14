import { NextResponse } from 'next/server';

function clearSession() {
  const response = NextResponse.json({ success: true });

  // Clear the norla session cookie
  response.cookies.set('norla_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}

export async function POST() {
  return clearSession();
}

export async function GET() {
  return clearSession();
}
