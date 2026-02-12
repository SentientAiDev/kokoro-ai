import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { createJournalEntry } from '../../../lib/journal';
import { reportError } from '../../../lib/infrastructure/error-reporting';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../lib/infrastructure/http';
import { createJournalEntrySchema } from '../../../lib/validation/journal';

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
    key: `journal:create:${session.user.id}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
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

  try {
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
    reportError({ event: 'journal.create.failed', error, requestId, data: { userId: session.user.id } });
    return NextResponse.json({ error: 'Unable to save your entry right now. Please try again.' }, { status: 500 });
  }
}
