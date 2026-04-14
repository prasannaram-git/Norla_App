import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/scan', '/history', '/profile'];
const AUTH_ROUTES = ['/login', '/sign-in', '/sign-up', '/forgot-password'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for admin panel — admin uses its own JWT auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Skip middleware for API routes (OTP, analyze, etc.)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for custom OTP session cookie
  const norlaSession = request.cookies.get('norla_session')?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // If user has our custom session cookie, they're authenticated
  if (norlaSession) {
    // Authenticated user trying to visit login → redirect to dashboard
    if (isAuthRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    // Authenticated user on protected route → allow
    return NextResponse.next();
  }

  // No custom session — also check Supabase auth as fallback
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key && url !== 'https://your-project.supabase.co') {
    try {
      let supabaseResponse = NextResponse.next({ request });

      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 3000)
      );

      const { data: { user } } = await Promise.race([
        supabase.auth.getUser(),
        timeoutPromise,
      ]);

      if (user) {
        // Supabase user authenticated
        if (isAuthRoute) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = '/dashboard';
          return NextResponse.redirect(redirectUrl);
        }
        return supabaseResponse;
      }
    } catch {
      // Supabase check failed, continue without
    }
  }

  // No auth at all — protect routes
  if (isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
