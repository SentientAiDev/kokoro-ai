import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import { deleteJournalEntry, updateJournalEntry } from '../../../../lib/application/journal-service';
import { enforceRateLimit, handleApiError, logApiRequest } from '../../../../lib/api-security';
import { journalEntryParamsSchema } from '../../../../lib/validation/api';
import { createJournalEntrySchema } from '../../../../lib/validation/journal';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedParams = journalEntryParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid journal id' }, { status: 400 });
    }

    logApiRequest({ route: '/api/journal/[id]', method: 'PUT', userId: session.user.id });
    const limited = await enforceRateLimit({
      key: `journal:update:${session.user.id}`,
      scope: 'journal.update',
      subjectId: session.user.id,
      maxRequests: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = createJournalEntrySchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Validation failed', details: body.error.flatten() }, { status: 400 });
    }

    const updated = await updateJournalEntry({ id: parsedParams.data.id, userId: session.user.id, content: body.data.content });
    if (!updated) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return handleApiError(error, '/api/journal/[id]');
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsedParams = journalEntryParamsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json({ error: 'Invalid journal id' }, { status: 400 });
    }

    logApiRequest({ route: '/api/journal/[id]', method: 'DELETE', userId: session.user.id });
    const limited = await enforceRateLimit({
      key: `journal:delete:${session.user.id}`,
      scope: 'journal.delete',
      subjectId: session.user.id,
      maxRequests: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const deleted = await deleteJournalEntry({ id: parsedParams.data.id, userId: session.user.id });
    if (!deleted) {
      return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error, '/api/journal/[id]');
  }
}
