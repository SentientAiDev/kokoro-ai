import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { createJournalEntry } from '../../../lib/application/journal-service';
import { createJournalEntrySchema } from '../../../lib/validation/journal';
import { enforceRateLimit, handleApiError, logApiRequest } from '../../../lib/api-security';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logApiRequest({ route: '/api/journal', method: 'POST', userId: session.user.id });

    const rateLimited = await enforceRateLimit({
      key: `journal:create:${session.user.id}`,
      scope: 'journal.create',
      subjectId: session.user.id,
      maxRequests: 10,
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
    const parsed = createJournalEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const journalEntry = await createJournalEntry(session.user.id, parsed.data.content);

    return NextResponse.json(
      {
        id: journalEntry.id,
        content: journalEntry.content,
        createdAt: journalEntry.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, '/api/journal');
  }
}
