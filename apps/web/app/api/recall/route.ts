import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../lib/auth';
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
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `recall:read:${session.user.id}`,
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
    const items = await MemoryService.recall(session.user.id, parsed.data.q);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    reportError({ event: 'recall.read.failed', error, requestId, data: { userId: session.user.id } });
    return NextResponse.json({ error: 'Unable to load memory recall right now. Please try again.' }, { status: 500 });
  }
}
