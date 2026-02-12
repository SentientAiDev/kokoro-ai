import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { consumeRateLimit, logRateLimitExceeded } from '../../../../lib/rate-limit';

const handler = NextAuth(authOptions);

async function enforceAuthRateLimit(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const result = await consumeRateLimit({
    key: `auth:endpoint:${forwarded}`,
    maxRequests: 30,
    windowMs: 60_000,
  });

  if (!result.allowed) {
    logRateLimitExceeded({ scope: 'auth.endpoint', subjectId: forwarded });
    return Response.json({ error: 'Too many auth requests. Please retry shortly.' }, { status: 429 });
  }

  return null;
}

export async function GET(request: Request) {
  const limited = await enforceAuthRateLimit(request);
  if (limited) return limited;
  return handler(request);
}

export async function POST(request: Request) {
  const limited = await enforceAuthRateLimit(request);
  if (limited) return limited;
  return handler(request);
}
