import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { MemoryService } from '../../../lib/application/memory-service';
import { enforceRequestRateLimit, getRequestId, logRequest } from '../../../lib/infrastructure/http';

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `memory:bulk-delete:${session.user.id}`,
    maxRequests: 5,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  const result = await MemoryService.deleteAllMemories(session.user.id);
  return NextResponse.json(result, { status: 200 });
}
