import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../../lib/auth';
import { memoryService } from '../../../../../lib/application/memory-service';
import { enforceRateLimit } from '../../../../../lib/api-security';
import { memoryRouteParamsSchema } from '../../../../../lib/validation/api';

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

  const rateLimitResponse = await enforceRateLimit({
    key: `memory:delete:${session.user.id}`,
    scope: 'memory.delete',
    subjectId: session.user.id,
    maxRequests: 20,
    windowMs: 60_000,
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const parsed = memoryRouteParamsSchema.safeParse(await context.params);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Unsupported memory type' }, { status: 400 });
  }

  const deleted = await memoryService.deleteMemory({
    userId: session.user.id,
    memoryType: parsed.data.memoryType,
    id: parsed.data.id,
  });

  if (!deleted) {
    return NextResponse.json({ error: 'Memory item not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
