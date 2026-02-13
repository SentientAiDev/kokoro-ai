import { NextResponse } from 'next/server';
import { getActor } from '../../../../lib/actor';
import { listActiveCheckInSuggestions } from '../../../../lib/check-ins';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../lib/infrastructure/http';
import { reportError } from '../../../../lib/infrastructure/error-reporting';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `checkin:suggestions:read:${actor.actorId}`,
    maxRequests: 60,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const suggestions = await listActiveCheckInSuggestions(actor.actorId);
    return NextResponse.json({ suggestions }, { status: 200 });
  } catch (error) {
    reportError({ event: 'checkin.suggestions.read.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Unable to load check-in suggestions right now. Please retry.' }, { status: 500 });
  }
}
