import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

const PROTECTED_ROUTES = ['/dashboard', '/scan', '/history', '/profile'];
const AUTH_ROUTES = ['/login'];

/**
 * FAST middleware — uses HMAC session cookie ONLY.
 * 
 * No Supabase calls = zero network latency on every navigation.
 * The HMAC cookie is cryptographically verified in ~1ms.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for admin panel — admin uses its own JWT auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Skip middleware for ALL API routes (OTP, analyze, sync, etc.)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Verify HMAC-signed session cookie (prevents forgery) — ~1ms, no network
  const sessionCookie = request.cookies.get('norla_session')?.value;
  const sessionPhone = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If session is valid (signed cookie verified), user is authenticated
  if (sessionPhone) {
    // Authenticated user trying to visit login → redirect to dashboard
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    // Authenticated user on protected route → allow immediately
    return NextResponse.next();
  }

  // No valid session — protect routes
  if (isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  // CRITICAL: Exclude API routes from middleware entirely.
  // The middleware matcher determines which routes the middleware RUNS on.
  // By excluding /api, Next.js won't buffer the request body through middleware.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
