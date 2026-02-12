import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { writePreferenceMemory } from '../../../lib/preference-memory';
import { consumeRateLimit } from '../../../lib/rate-limit';
import { writePreferenceMemorySchema } from '../../../lib/validation/preference-memory';

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `preferences:write:${session.user.id}`,
    maxRequests: 20,
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
}
