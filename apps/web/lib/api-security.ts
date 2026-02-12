import { NextResponse } from 'next/server';
import { consumeRateLimit, logRateLimitExceeded } from './rate-limit';
import { logInfo, reportError } from './structured-logging';

export async function enforceRateLimit(input: {
  key: string;
  scope: string;
  subjectId: string;
  maxRequests: number;
  windowMs: number;
}) {
  const result = await consumeRateLimit({ key: input.key, maxRequests: input.maxRequests, windowMs: input.windowMs });

  if (!result.allowed) {
    logRateLimitExceeded({ scope: input.scope, subjectId: input.subjectId });
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
        retryAfterSeconds: Math.max(1, Math.ceil((result.resetAtMs - Date.now()) / 1000)),
      },
      { status: 429 },
    );
  }

  return null;
}

export function logApiRequest(input: { route: string; method: string; userId?: string | null }) {
  logInfo('api.request', {
    route: input.route,
    method: input.method,
    hasUser: Boolean(input.userId),
  });
}

export function handleApiError(error: unknown, route: string) {
  reportError(error, { route });
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
