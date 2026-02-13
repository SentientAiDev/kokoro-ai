import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthSessionMock = vi.fn();
const cookieGetMock = vi.fn();
const upsertMock = vi.fn();

vi.mock('../lib/auth', () => ({ getAuthSession: getAuthSessionMock }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGetMock }) }));
vi.mock('../lib/prisma', () => ({ prisma: { user: { upsert: upsertMock } } }));

describe('getActor', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = 'actor-test-secret';
    process.env.AUTH_REQUIRED = 'false';
    getAuthSessionMock.mockReset();
    cookieGetMock.mockReset();
    upsertMock.mockReset();
  });

  it('returns a user actor for authenticated sessions', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    const { getActor } = await import('../lib/actor');
    await expect(getActor()).resolves.toEqual({ kind: 'USER', actorId: 'user-1' });
  });

  it('returns a guest actor and upserts guest user', async () => {
    const { signGuestId } = await import('../lib/guest-cookie');
    getAuthSessionMock.mockResolvedValue(null);
    cookieGetMock.mockReturnValue({ value: await signGuestId('guest-uuid') });
    upsertMock.mockResolvedValue({ id: 'guest-user-id' });

    const { getActor } = await import('../lib/actor');
    await expect(getActor()).resolves.toEqual({ kind: 'GUEST', actorId: 'guest-user-id', guestId: 'guest-uuid' });
  });
});
