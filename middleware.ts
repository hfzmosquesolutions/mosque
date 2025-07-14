import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Get the auth token from common Supabase cookie names
  const hasAuthToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('supabase-auth-token')?.value ||
    req.cookies.get('sb-joenlldgpqnwvnlvpuax-auth-token')?.value ||
    req.cookies.get('supabase.auth.token')?.value ||
    req.cookies.get('sb-localhost-auth-token')?.value;

  const hasSession = !!hasAuthToken;

  // Auth condition
  const isAuthPage =
    req.nextUrl.pathname.startsWith('/login') ||
    req.nextUrl.pathname.startsWith('/signup') ||
    req.nextUrl.pathname.startsWith('/forgot-password') ||
    req.nextUrl.pathname.startsWith('/auth/');

  const isOnboardingPage = req.nextUrl.pathname.startsWith('/onboarding');

  const isProtectedRoute =
    req.nextUrl.pathname.startsWith('/dashboard') ||
    req.nextUrl.pathname.startsWith('/members') ||
    req.nextUrl.pathname.startsWith('/finance') ||
    req.nextUrl.pathname.startsWith('/programs') ||
    req.nextUrl.pathname.startsWith('/bookings') ||
    req.nextUrl.pathname.startsWith('/reports') ||
    req.nextUrl.pathname.startsWith('/zakat') ||
    req.nextUrl.pathname.startsWith('/mosque-profile') ||
    req.nextUrl.pathname.startsWith('/account') ||
    isOnboardingPage;

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to dashboard if accessing auth pages with session
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
