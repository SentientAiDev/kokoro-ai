import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { createJournalEntry } from '../../../lib/journal';
import { consumeRateLimit } from '../../../lib/rate-limit';
import { createJournalEntrySchema } from '../../../lib/validation/journal';

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const rateLimit = consumeRateLimit({
    key: `journal:create:${session.user.id}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again.' },
      { status: 429 },
    );
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
}
