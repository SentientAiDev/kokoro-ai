import { describe, expect, it, vi } from 'vitest';

import { checkRateLimit } from '../lib/rate-limit';

describe('checkRateLimit', () => {
  it('allows requests until maxRequests is reached and then blocks', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);

    const first = checkRateLimit('key-1', { maxRequests: 2, windowMs: 1000 });
    const second = checkRateLimit('key-1', { maxRequests: 2, windowMs: 1000 });
    const third = checkRateLimit('key-1', { maxRequests: 2, windowMs: 1000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(1);

    nowSpy.mockRestore();
  });

  it('resets after the configured window', () => {
    const nowSpy = vi.spyOn(Date, 'now');

    nowSpy.mockReturnValue(2000);
    expect(checkRateLimit('key-2', { maxRequests: 1, windowMs: 1000 }).allowed).toBe(true);

    nowSpy.mockReturnValue(2001);
    expect(checkRateLimit('key-2', { maxRequests: 1, windowMs: 1000 }).allowed).toBe(false);

    nowSpy.mockReturnValue(3001);
    expect(checkRateLimit('key-2', { maxRequests: 1, windowMs: 1000 }).allowed).toBe(true);

    nowSpy.mockRestore();
  });
});
