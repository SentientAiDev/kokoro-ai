import { NextResponse } from 'next/server';
import { enforceRateLimit } from '../rate-limit';
import { logInfo } from './logger';

export function getRequestId(request: Request) {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

export function logRequest(request: Request, requestId: string, userId?: string) {
  logInfo({
    event: 'http.request',
    message: 'Incoming API request',
    requestId,
    data: {
      method: request.method,
      pathname: new URL(request.url).pathname,
      userId,
    },
  });
}

export async function enforceRequestRateLimit(input: {
  request: Request;
  requestId: string;
  key: string;
  maxRequests: number;
  windowMs: number;
  metadata?: Record<string, unknown>;
}) {
  const rateLimit = await enforceRateLimit({
    key: input.key,
    maxRequests: input.maxRequests,
    windowMs: input.windowMs,
    requestId: input.requestId,
    metadata: input.metadata,
  });

  if (rateLimit.allowed) {
    return null;
  }

  return NextResponse.json(
    {
      error: 'Too many requests. Please slow down and try again.',
      retryAfterMs: Math.max(0, rateLimit.resetAtMs - Date.now()),
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.max(1, Math.ceil((rateLimit.resetAtMs - Date.now()) / 1000)).toString(),
      },
    },
  );
}
