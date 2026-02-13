import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '../../../lib/actor';
import { MemoryService } from '../../../lib/application/memory-service';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../lib/infrastructure/http';
import { reportError } from '../../../lib/infrastructure/error-reporting';

const recallQuerySchema = z.object({
  q: z.string().max(200).optional().default(''),
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
    key: `recall:read:${actor.actorId}`,
    maxRequests: 30,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const { searchParams } = new URL(request.url);
  const parsed = recallQuerySchema.safeParse({ q: searchParams.get('q') ?? '' });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const items = await MemoryService.recall(actor.actorId, parsed.data.q);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    reportError({ event: 'recall.read.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Unable to load memory recall right now. Please try again.' }, { status: 500 });
  }
}
