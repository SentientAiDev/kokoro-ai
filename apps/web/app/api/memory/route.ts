import { NextResponse } from 'next/server';
import { getActor } from '../../../lib/actor';
import { MemoryService } from '../../../lib/application/memory-service';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../lib/infrastructure/http';

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `memory:bulk-delete:${actor.actorId}`,
    maxRequests: 5,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const result = await MemoryService.deleteAllMemories(actor.actorId);
  return NextResponse.json(result, { status: 200 });
}
