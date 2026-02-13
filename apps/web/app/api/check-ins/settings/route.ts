import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '../../../../lib/actor';
import { getCheckInSettings, updateCheckInSettings } from '../../../../lib/check-ins';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../../lib/infrastructure/http';
import { reportError } from '../../../../lib/infrastructure/error-reporting';

const settingsSchema = z.object({
  proactiveCheckIns: z.boolean(),
  checkInWindowStart: z.string().regex(/^\d{2}:\d{2}$/),
  checkInWindowEnd: z.string().regex(/^\d{2}:\d{2}$/),
  checkInMaxPerDay: z.number().int().min(1).max(10),
  checkInInactivityDays: z.number().int().min(1).max(30),
});

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
    key: `checkin:settings:read:${actor.actorId}`,
    maxRequests: 60,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const settings = await getCheckInSettings(actor.actorId);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    reportError({ event: 'checkin.settings.read.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Unable to load check-in settings right now. Please retry.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }


  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `checkin:settings:update:${actor.actorId}`,
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

  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const settings = await updateCheckInSettings(actor.actorId, parsed.data);
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    reportError({ event: 'checkin.settings.update.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Unable to save settings right now. Please retry.' }, { status: 500 });
  }
}
