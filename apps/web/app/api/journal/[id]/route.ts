import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '../../../../lib/actor';
import { deleteJournalEntry, updateJournalEntry } from '../../../../lib/journal';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../lib/infrastructure/http';
import { reportError } from '../../../../lib/infrastructure/error-reporting';
import { createJournalEntrySchema } from '../../../../lib/validation/journal';

const routeParamsSchema = z.object({ id: z.string().cuid() });

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = routeParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `journal:update:${actor.actorId}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const body: unknown = await request.json();
    const parsed = createJournalEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await updateJournalEntry(parsedParams.data.id, actor.actorId, parsed.data.content);

    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    reportError({ event: 'journal.update.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = routeParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Invalid entry id' }, { status: 400 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `journal:delete:${actor.actorId}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const deleted = await deleteJournalEntry(parsedParams.data.id, actor.actorId);

  if (!deleted) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
