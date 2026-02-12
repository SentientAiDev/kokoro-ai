import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import { listActiveCheckInSuggestions } from '../../../../lib/check-ins';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../lib/infrastructure/http';
import { reportError } from '../../../../lib/infrastructure/error-reporting';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `checkin:suggestions:read:${session.user.id}`,
    maxRequests: 60,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const suggestions = await listActiveCheckInSuggestions(session.user.id);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    reportError({ event: 'checkin.suggestions.read.failed', error, requestId, data: { userId: session.user.id } });
    return NextResponse.json({ error: 'Unable to load check-in suggestions right now. Please retry.' }, { status: 500 });
  }
}
