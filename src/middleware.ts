
import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/context/actions';
import { cookies } from 'next/headers';

const protectedRoutes = ['/', '/cases', '/tasks', '/meetings', '/accounts', '/documents', '/emails', '/reports', '/admin', '/profile', '/settings'];
const publicRoutes = ['/login'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);

  // 1. Try to get the session from the cookie
  const cookie = cookies().get('session')?.value;
  const session = cookie ? await decrypt(cookie) : null;

  // 2. Redirect to /login if not authenticated and trying to access a protected route
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // 3. If authenticated and trying to access the login page, redirect to home
  if (session?.userId && publicRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
