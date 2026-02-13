import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { cookies } from 'next/headers';
import { GUEST_COOKIE_NAME, getGuestCookieOptions, verifyGuestCookie } from '../../../lib/guest-cookie';
import { migrateGuestDataToUser } from '../../../lib/guest-migration';

export async function GET(request: Request) {
  const session = await getAuthSession();
  const cookieStore = await cookies();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const guestCookie = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  const guestId = await verifyGuestCookie(guestCookie);

  if (guestId) {
    await migrateGuestDataToUser(guestId, session.user.id);
  }

  cookieStore.set(GUEST_COOKIE_NAME, '', { ...getGuestCookieOptions(), maxAge: 0 });

  return NextResponse.redirect(new URL('/settings', request.url));
}
