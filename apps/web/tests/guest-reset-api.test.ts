import { beforeEach, describe, expect, it, vi } from 'vitest';

const cookieGetMock = vi.fn();
const cookieSetMock = vi.fn();
const findUniqueMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookieGetMock, set: cookieSetMock }) }));
vi.mock('../lib/prisma', () => ({ prisma: { user: { findUnique: findUniqueMock, delete: deleteMock } } }));

describe('/api/guest/reset', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXTAUTH_SECRET = 'reset-secret';
    cookieGetMock.mockReset();
    cookieSetMock.mockReset();
    findUniqueMock.mockReset();
    deleteMock.mockReset();
  });

  it('deletes guest user and clears cookie', async () => {
    const { signGuestId } = await import('../lib/guest-cookie');
    cookieGetMock.mockReturnValue({ value: await signGuestId('guest-1') });
    findUniqueMock.mockResolvedValue({ id: 'guest-user-1', isGuest: true });

    const mod = await import('../app/api/guest/reset/route');
    const response = await mod.POST();

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: 'guest-user-1' } });
    expect(cookieSetMock).toHaveBeenCalled();
  });
});
