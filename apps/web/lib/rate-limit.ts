import {
  consumeInMemoryRateLimit,
  consumeRateLimit as consumeRateLimitAsync,
  resetRateLimitBuckets,
} from './infrastructure/rate-limit';

export async function enforceRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
}) {
  return consumeRateLimitAsync(input);
}

export function consumeRateLimit(input: {
  key: string;
  maxRequests: number;
  windowMs: number;
  nowMs?: number;
}) {
  return consumeInMemoryRateLimit(input);
}

export { resetRateLimitBuckets };
