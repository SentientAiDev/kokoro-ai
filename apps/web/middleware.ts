import { NextRequest, NextResponse } from 'next/server';
import { createSignedGuestCookieValue, getGuestCookieOptions, GUEST_COOKIE_NAME, verifyGuestCookie } from './lib/guest-cookie';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none';",
  );

  const existingGuestCookie = request.cookies.get(GUEST_COOKIE_NAME)?.value;
  const guestId = await verifyGuestCookie(existingGuestCookie);

  if (!guestId) {
    const nextGuestCookie = await createSignedGuestCookieValue();
    response.cookies.set(GUEST_COOKIE_NAME, nextGuestCookie.value, getGuestCookieOptions());
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
