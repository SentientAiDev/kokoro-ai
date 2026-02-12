import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../../../../lib/auth';
import { applyCheckInSuggestionAction } from '../../../../../../lib/check-ins';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../../../lib/infrastructure/http';
import { reportError } from '../../../../../../lib/infrastructure/error-reporting';

const paramsSchema = z.object({ id: z.string().cuid() });

const actionSchema = z
  .object({
    action: z.enum(['dismiss', 'snooze', 'done']),
    snoozeDays: z.number().int().min(1).max(30).optional(),
  })
  .refine((data) => (data.action === 'snooze' ? Boolean(data.snoozeDays) : true), {
    message: 'snoozeDays is required when action is snooze',
    path: ['snoozeDays'],
  });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid suggestion id' }, { status: 400 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `checkin:action:${session.user.id}`,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const suggestion = await applyCheckInSuggestionAction({
      userId: session.user.id,
      suggestionId: parsedParams.data.id,
      action: parsed.data.action,
      snoozeDays: parsed.data.snoozeDays,
    });

    if (!suggestion) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    reportError({
      event: 'checkin.action.failed',
      error,
      requestId,
      data: { userId: session.user.id, suggestionId: parsedParams.data.id, action: parsed.data.action },
    });
    return NextResponse.json({ error: 'Unable to update this check-in right now. Please retry.' }, { status: 500 });
  }
}
