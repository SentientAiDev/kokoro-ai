import { NextResponse } from 'next/server';
import { runDailyCheckInScheduler } from '../../../../lib/check-ins';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../../lib/infrastructure/http';
import { reportError } from '../../../../lib/infrastructure/error-reporting';

function getSchedulerKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const fallback = request.headers.get('x-real-ip')?.trim();
  return forwarded || fallback || 'unknown';
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  logRequest(request, requestId);

  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `checkin:daily-job:${getSchedulerKey(request)}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const result = await runDailyCheckInScheduler();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    reportError({ event: 'checkin.daily_job.failed', error, requestId });
    return NextResponse.json({ error: 'Unable to run daily check-in job right now.' }, { status: 500 });
  }
}
