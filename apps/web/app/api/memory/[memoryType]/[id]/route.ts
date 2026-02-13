import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getActor } from '../../../../../lib/actor';
import { MemoryService } from '../../../../../lib/application/memory-service';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../../lib/infrastructure/http';
import { reportError } from '../../../../../lib/infrastructure/error-reporting';

const paramsSchema = z.object({
  memoryType: z.enum(['episodic', 'preference']),
  id: z.string().cuid(),
});

type RouteContext = {
  params: Promise<{
    memoryType: string;
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Unsupported memory type or id' }, { status: 400 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `memory:delete:${actor.actorId}`,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const deleted = await MemoryService.deleteMemory({
      userId: actor.actorId,
      memoryType: parsedParams.data.memoryType,
      id: parsedParams.data.id,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    reportError({
      event: 'memory.delete.failed',
      error,
      requestId,
      data: { userId: actor.actorId, memoryType: parsedParams.data.memoryType, memoryId: parsedParams.data.id },
    });
    return NextResponse.json({ error: 'Unable to delete memory right now. Please retry.' }, { status: 500 });
  }
}
