import { NextResponse } from 'next/server';
import { getActor } from '../../../lib/actor';
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
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `journal:create:${actor.actorId}`,
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
    const journalEntry = await createJournalEntry(actor.actorId, parsed.data.content);

    return NextResponse.json(
      {
        id: journalEntry.id,
        content: journalEntry.content,
        createdAt: journalEntry.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    reportError({ event: 'journal.create.failed', error, requestId, data: { userId: actor.actorId } });
    return NextResponse.json({ error: 'Unable to save your entry right now. Please try again.' }, { status: 500 });
  }
}
