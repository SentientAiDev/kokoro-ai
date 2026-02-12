import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { searchRecall } from '../../../lib/recall';
import { consumeRateLimit } from '../../../lib/rate-limit';

export async function GET(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
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
  const query = searchParams.get('q') ?? '';

  const items = await searchRecall(session.user.id, query);

  return NextResponse.json({ items }, { status: 200 });
}
