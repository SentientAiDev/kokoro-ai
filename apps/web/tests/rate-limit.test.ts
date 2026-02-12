import { describe, expect, it } from 'vitest';
import { consumeRateLimit, resetRateLimitBuckets } from '../lib/rate-limit';

describe('rate limiter', () => {
  it('blocks after threshold inside window', () => {
    resetRateLimitBuckets();
    const input = { key: 'test:user', maxRequests: 2, windowMs: 1000, nowMs: 1000 };

    expect(consumeRateLimit(input).allowed).toBe(true);
    expect(consumeRateLimit({ ...input, nowMs: 1200 }).allowed).toBe(true);
    expect(consumeRateLimit({ ...input, nowMs: 1300 }).allowed).toBe(false);
  });

  it('resets after window', () => {
    resetRateLimitBuckets();
    const input = { key: 'test:window', maxRequests: 1, windowMs: 1000, nowMs: 1000 };

    expect(consumeRateLimit(input).allowed).toBe(true);
    expect(consumeRateLimit({ ...input, nowMs: 1500 }).allowed).toBe(false);
    expect(consumeRateLimit({ ...input, nowMs: 2100 }).allowed).toBe(true);
  });
});
