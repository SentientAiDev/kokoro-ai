import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { createJournalEntry } from '../../../lib/journal';
import { checkRateLimit } from '../../../lib/rate-limit';
import { createJournalEntrySchema } from '../../../lib/validation/journal';

const JOURNAL_POST_RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60_000,
};

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = checkRateLimit(`journal:post:${session.user.id}`, JOURNAL_POST_RATE_LIMIT);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      },
    );
  }

  const body = await request.json();
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
