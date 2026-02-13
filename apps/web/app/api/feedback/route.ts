import { NextResponse } from 'next/server';
import { getActor } from '../../../lib/actor';
import { prisma } from '../../../lib/prisma';
import { reportError } from '../../../lib/infrastructure/error-reporting';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../lib/infrastructure/http';
import { redactText } from '../../../lib/infrastructure/redaction';
import { feedbackSchema } from '../../../lib/validation/feedback';

type FeedbackDb = {
  feedbackMessage: {
    create(args: {
      data: {
        userId: string | null;
        email: string | null;
        message: string;
        page?: string;
      };
      select: { id: true; createdAt: true };
    }): Promise<{ id: string; createdAt: Date }>;
  };
};

const db = prisma as unknown as FeedbackDb;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  const keySuffix = actor?.actorId ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `feedback:create:${keySuffix}`,
    maxRequests: 15,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const body: unknown = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await db.feedbackMessage.create({
      data: {
        userId: actor?.actorId ?? null,
        email: parsed.data.email ? redactText(parsed.data.email) : null,
        message: redactText(parsed.data.message),
        page: parsed.data.page,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ id: result.id, createdAt: result.createdAt }, { status: 201 });
  } catch (error) {
    reportError({ event: 'feedback.create.failed', error, requestId, data: { hasSession: Boolean(actor?.actorId) } });
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
