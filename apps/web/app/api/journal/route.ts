import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { createJournalEntry } from '../../../lib/journal';
import { createJournalEntrySchema } from '../../../lib/validation/journal';

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
