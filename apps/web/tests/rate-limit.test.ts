import { describe, expect, it } from 'vitest';
import { consumeRateLimit, resetRateLimitBuckets } from '../lib/rate-limit';

describe('rate limit', () => {
  it('blocks after max requests in window', async () => {
    resetRateLimitBuckets();

    const first = await consumeRateLimit({ key: 'k', maxRequests: 2, windowMs: 1000, nowMs: 0 });
    const second = await consumeRateLimit({ key: 'k', maxRequests: 2, windowMs: 1000, nowMs: 1 });
    const third = await consumeRateLimit({ key: 'k', maxRequests: 2, windowMs: 1000, nowMs: 2 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
  });
});
