import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that don't require authentication
  const publicPaths = ['/login', '/register', '/'];
  const isPublicPath = publicPaths.includes(pathname);

  // In a real Firebase setup with SSR, we would check a session cookie here.
  // For this MVP, we will rely on client-side protection or a basic cookie check.
  // If you implement next-firebase-auth-edge or manual cookies, check it here.
  const sessionToken = request.cookies.get('__session')?.value;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding') || pathname.startsWith('/settings')) {
    if (!sessionToken) {
      // User is not authenticated, redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      // NOTE: For pure client-side MVP without cookies, we might bypass this 
      // and do protection in a DashboardLayout component instead.
      // Uncomment the below if session cookies are active:
      // return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (isPublicPath && pathname !== '/' && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
