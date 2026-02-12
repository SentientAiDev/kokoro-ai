import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../../../lib/auth';
import { MemoryService } from '../../../../../lib/application/memory-service';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../../../lib/infrastructure/http';

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
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedParams = paramsSchema.safeParse(await context.params);

  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Unsupported memory type or id' }, { status: 400 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `memory:delete:${session.user.id}`,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const deleted = await MemoryService.deleteMemory({
    userId: session.user.id,
    memoryType: parsedParams.data.memoryType,
    id: parsedParams.data.id,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
