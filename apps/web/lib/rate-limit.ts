type RateLimitKey = string;

type RateLimitBucket = {
  windowStartedAtMs: number;
  count: number;
};

const buckets = new Map<RateLimitKey, RateLimitBucket>();

export function consumeRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}) {
  const nowMs = input.nowMs ?? Date.now();
  const current = buckets.get(input.key);

  if (!current || nowMs - current.windowStartedAtMs >= input.windowMs) {
    buckets.set(input.key, {
      windowStartedAtMs: nowMs,
      count: 1,
    });

    return {
      allowed: true,
      remaining: input.maxRequests - 1,
      resetAtMs: nowMs + input.windowMs,
    };
  }

  if (current.count >= input.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAtMs: current.windowStartedAtMs + input.windowMs,
    };
  }

  current.count += 1;
  buckets.set(input.key, current);

  return {
    allowed: true,
    remaining: input.maxRequests - current.count,
    resetAtMs: current.windowStartedAtMs + input.windowMs,
  };
}

export function resetRateLimitBuckets() {
  buckets.clear();
}
