import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const sessionToken = req.cookies.get('__Secure-authjs.session-token')?.value
      || req.cookies.get('authjs.session-token')?.value;
    if (!sessionToken) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === '/login' || pathname === '/register') {
    const sessionToken = req.cookies.get('__Secure-authjs.session-token')?.value
      || req.cookies.get('authjs.session-token')?.value;
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
