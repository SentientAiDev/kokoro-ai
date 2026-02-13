import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { GUEST_COOKIE_NAME, getGuestCookieOptions, verifyGuestCookie } from '../../../../lib/guest-cookie';

type GuestResetDb = {
  user: {
    findUnique(args: { where: { guestId: string }; select: { id: true; isGuest: true } }): Promise<{ id: string; isGuest: boolean } | null>;
    delete(args: { where: { id: string } }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as GuestResetDb;

export async function POST() {
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get(GUEST_COOKIE_NAME)?.value;
  const guestId = await verifyGuestCookie(rawCookie);

  if (!guestId) {
    return NextResponse.json({ ok: true });
  }

  const guestUser = await db.user.findUnique({ where: { guestId }, select: { id: true, isGuest: true } });

  if (guestUser?.isGuest) {
    await db.user.delete({ where: { id: guestUser.id } });
  }

  cookieStore.set(GUEST_COOKIE_NAME, '', { ...getGuestCookieOptions(), maxAge: 0 });

  return NextResponse.json({ ok: true });
}
