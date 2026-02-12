type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  windowStart: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existingState = rateLimitStore.get(key);

  if (!existingState || now - existingState.windowStart >= config.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existingState.count >= config.maxRequests) {
    const retryAfterMs = config.windowMs - (now - existingState.windowStart);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  existingState.count += 1;
  rateLimitStore.set(key, existingState);

  return { allowed: true, retryAfterSeconds: 0 };
}

