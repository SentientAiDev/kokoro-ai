import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { memoryService } from '../../../lib/application/memory-service';
import { writePreferenceMemorySchema } from '../../../lib/validation/preference-memory';
import { enforceRateLimit, handleApiError, logApiRequest } from '../../../lib/api-security';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logApiRequest({ route: '/api/preferences', method: 'POST', userId: session.user.id });

    const rateLimited = await enforceRateLimit({
      key: `preferences:write:${session.user.id}`,
      scope: 'preferences.write',
      subjectId: session.user.id,
      maxRequests: 20,
      windowMs: 60_000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = writePreferenceMemorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const memory = await memoryService.writePreferenceMemory({
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
    return handleApiError(error, '/api/preferences');
  }
}
