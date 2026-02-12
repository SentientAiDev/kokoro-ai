import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../../lib/infrastructure/http';

const handler = NextAuth(authOptions);

export async function GET(request: Request) {
  return handler(request);
}

export async function POST(request: Request) {
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
