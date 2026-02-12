import { createHash } from 'node:crypto';
import { logWarn } from './structured-logging';

type RateLimitKey = string;

type RateLimitBucket = {
  windowStartedAtMs: number;
  count: number;
};

const buckets = new Map<RateLimitKey, RateLimitBucket>();

async function consumeInMemory(input: {
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

async function consumeUpstash(input: { key: string; maxRequests: number; windowMs: number }) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error('Upstash is not configured');
  }

  const safeKey = createHash('sha256').update(input.key).digest('hex');
  const redisKey = `ratelimit:${safeKey}`;
  const expiresInSeconds = Math.ceil(input.windowMs / 1000);

  const response = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', redisKey],
      ['TTL', redisKey],
      ['EXPIRE', redisKey, expiresInSeconds, 'NX'],
    ]),
  });

  if (!response.ok) {
    throw new Error('Upstash request failed');
  }

  const payload = (await response.json()) as Array<{ result: number }>;
  const count = Number(payload[0]?.result ?? 1);
  const ttl = Number(payload[1]?.result ?? expiresInSeconds);
  const resetAtMs = Date.now() + Math.max(ttl, 1) * 1000;

  return {
    allowed: count <= input.maxRequests,
    remaining: Math.max(input.maxRequests - count, 0),
    resetAtMs,
  };
}

export async function consumeRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}) {
  const useUpstash = process.env.RATE_LIMIT_DRIVER === 'upstash';

  try {
    return useUpstash ? await consumeUpstash(input) : await consumeInMemory(input);
  } catch {
    logWarn('rate_limit.backend_fallback', { scope: input.key.split(':')[0] ?? 'unknown' });
    return consumeInMemory(input);
  }
}

export function logRateLimitExceeded(input: { scope: string; subjectId: string }) {
  logWarn('rate_limit.exceeded', {
    scope: input.scope,
    subjectHash: createHash('sha256').update(input.subjectId).digest('hex').slice(0, 12),
  });
}

export function resetRateLimitBuckets() {
  buckets.clear();
}
