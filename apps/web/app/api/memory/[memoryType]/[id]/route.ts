import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { deleteMemoryItem } from '../../../../../lib/recall';
import { consumeRateLimit } from '../../../../../lib/rate-limit';

type RouteContext = {
  params: Promise<{
    memoryType: string;
    id: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimit = consumeRateLimit({
    key: `memory:delete:${session.user.id}`,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down and try again.' },
      { status: 429 },
    );
  }

  const { memoryType, id } = await context.params;

  if (memoryType !== 'episodic' && memoryType !== 'preference') {
    return NextResponse.json({ error: 'Unsupported memory type' }, { status: 400 });
  }

  const deleted = await deleteMemoryItem({
    userId: session.user.id,
    memoryType,
    id,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
