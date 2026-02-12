import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { memoryService } from '../../../lib/application/memory-service';
import { consumeRateLimit } from '../../../lib/rate-limit';
import { recallQuerySchema } from '../../../lib/validation/api';

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit({
    key: `recall:read:${session.user.id}`,
    maxRequests: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again.' },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = recallQuerySchema.safeParse({ q: searchParams.get('q') ?? '' });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const items = await memoryService.recall(session.user.id, parsed.data.q);

  return NextResponse.json({ items }, { status: 200 });
}
