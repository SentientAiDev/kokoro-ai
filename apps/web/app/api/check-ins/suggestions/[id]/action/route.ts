import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../../lib/auth';
import { applyCheckInSuggestionAction } from '../../../../../../lib/check-ins';
import { enforceRateLimit } from '../../../../../../lib/api-security';
import { checkInActionParamsSchema, checkInActionSchema } from '../../../../../../lib/validation/api';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    key: `checkins:action:${session.user.id}`,
    scope: 'checkins.action',
    subjectId: session.user.id,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = checkInActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const parsedParams = checkInActionParamsSchema.safeParse(await params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsedParams.error.flatten() }, { status: 400 });
  }

  const suggestion = await applyCheckInSuggestionAction({
    userId: session.user.id,
    suggestionId: parsedParams.data.id,
    action: parsed.data.action,
    snoozeDays: parsed.data.snoozeDays,
  });

  if (!suggestion) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(suggestion, { status: 200 });
}
