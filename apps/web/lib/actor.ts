import { cookies } from 'next/headers';
import { getAuthSession } from './auth';
import { prisma } from './prisma';
import { AUTH_REQUIRED } from './env';
import { GUEST_COOKIE_NAME, verifyGuestCookie } from './guest-cookie';

export type Actor =
  | { kind: 'USER'; actorId: string }
  | { kind: 'GUEST'; actorId: string; guestId: string };

type ActorDb = {
  user: {
    upsert(args: {
      where: { guestId: string };
      create: { isGuest: true; guestId: string };
      update: { isGuest: true };
      select: { id: true };
    }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as ActorDb;

export async function getActor(): Promise<Actor | null> {
  const session = await getAuthSession();

  if (session?.user?.id) {
    return { kind: 'USER', actorId: session.user.id };
  }

  if (AUTH_REQUIRED) {
    return null;
  }

  const guestCookie = (await cookies()).get(GUEST_COOKIE_NAME)?.value;
  const guestId = await verifyGuestCookie(guestCookie);

  if (!guestId) {
    return null;
  }

  const guestUser = await db.user.upsert({
    where: { guestId },
    create: { isGuest: true, guestId },
    update: { isGuest: true },
    select: { id: true },
  });

  return { kind: 'GUEST', actorId: guestUser.id, guestId };
}
