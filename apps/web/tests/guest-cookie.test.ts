import { describe, expect, it } from 'vitest';
import { createSignedGuestCookieValue, signGuestId, verifyGuestCookie } from '../lib/guest-cookie';

describe('guest cookie signing', () => {
  it('signs and verifies a guest id', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const value = await signGuestId('guest-123');
    await expect(verifyGuestCookie(value)).resolves.toBe('guest-123');
  });

  it('rejects tampered cookies', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const value = await signGuestId('guest-123');
    await expect(verifyGuestCookie(`${value}tampered`)).resolves.toBeNull();
  });

  it('creates random signed cookie values', async () => {
    process.env.NEXTAUTH_SECRET = 'test-secret';
    const first = await createSignedGuestCookieValue();
    const second = await createSignedGuestCookieValue();
    expect(first.value).not.toEqual(second.value);
  });
});
