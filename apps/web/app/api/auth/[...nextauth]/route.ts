import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../../lib/infrastructure/http';

const handler = authOptions.providers?.length ? NextAuth(authOptions) : null;

export async function GET(request: Request) {
  if (!handler) {
    return new Response('Auth not configured', { status: 404 });
  }

  return handler(request);
}

export async function POST(request: Request) {
  if (!handler) {
    return new Response('Auth not configured', { status: 404 });
  }

  const requestId = getRequestId(request);
  logRequest(request, requestId);

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `auth:post:${request.headers.get('x-forwarded-for') ?? 'unknown'}`,
    maxRequests: 30,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  return handler(request);
}
