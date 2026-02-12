import { logWarn } from './logger';

type RateLimitKey = string;

type RateLimitBucket = {
  windowStartedAtMs: number;
  count: number;
};

const buckets = new Map<RateLimitKey, RateLimitBucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
};

export function consumeInMemoryRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}): RateLimitResult {
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

async function consumeUpstashRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    return consumeInMemoryRateLimit(input);
  }

  const windowSeconds = Math.max(1, Math.floor(input.windowMs / 1000));
  const key = `rate:${input.key}`;

  const response = await fetch(`${baseUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, windowSeconds, 'NX'],
      ['PTTL', key],
    ]),
  });

  if (!response.ok) {
    return consumeInMemoryRateLimit(input);
  }

  const payload = (await response.json()) as {
    result?: Array<{ result: number | null }>;
  };

  const count = Number(payload.result?.[0]?.result ?? 1);
  const pttl = Number(payload.result?.[2]?.result ?? input.windowMs);
  const resetAtMs = Date.now() + Math.max(pttl, 0);

  return {
    allowed: count <= input.maxRequests,
    remaining: Math.max(0, input.maxRequests - count),
    resetAtMs,
  };
}

export async function consumeRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
}): Promise<RateLimitResult> {
  const useUpstash = process.env.RATE_LIMIT_BACKEND === 'upstash';

  const result = useUpstash
    ? await consumeUpstashRateLimit(input)
    : consumeInMemoryRateLimit(input);

  if (!result.allowed) {
    logWarn({
      event: 'rate_limit.blocked',
      message: 'Request blocked by rate limiter',
      requestId: input.requestId,
      data: {
        key: input.key,
        maxRequests: input.maxRequests,
        windowMs: input.windowMs,
        resetAtMs: result.resetAtMs,
        ...input.metadata,
      },
    });
  }

  return result;
}

export function resetRateLimitBuckets() {
  buckets.clear();
}
