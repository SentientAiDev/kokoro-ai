import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { writePreferenceMemory } from '../../../lib/preference-memory';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../lib/infrastructure/http';
import { reportError } from '../../../lib/infrastructure/error-reporting';
import { writePreferenceMemorySchema } from '../../../lib/validation/preference-memory';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await getAuthSession();
  logRequest(request, requestId, session?.user?.id);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `preferences:write:${session.user.id}`,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const body: unknown = await request.json();
    const parsed = writePreferenceMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const memory = await writePreferenceMemory({
      ...parsed.data,
      userId: session.user.id,
    });

    return NextResponse.json(
      {
        id: memory.id,
        key: memory.key,
        value: memory.value,
        source: memory.source,
        consentGivenAt: memory.consentGivenAt,
        updatedAt: memory.updatedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    reportError({ event: 'preferences.write.failed', error, requestId, data: { userId: session.user.id } });
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
