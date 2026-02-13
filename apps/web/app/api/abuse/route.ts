import { NextResponse } from 'next/server';
import { getActor } from '../../../lib/actor';
import { prisma } from '../../../lib/prisma';
import { reportError } from '../../../lib/infrastructure/error-reporting';
import {
  enforceRequestRateLimit,
  getRequestId,
  logRequest,
} from '../../../lib/infrastructure/http';
import { redactJson, redactText } from '../../../lib/infrastructure/redaction';
import { abuseReportSchema } from '../../../lib/validation/abuse';

type AbuseDb = {
  abuseReport: {
    create(args: {
      data: {
        userId: string | null;
        category: string;
        message: string;
        email: string | null;
        metadata?: unknown;
      };
      select: { id: true; createdAt: true };
    }): Promise<{ id: string; createdAt: Date }>;
  };
};

const db = prisma as unknown as AbuseDb;


export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const actor = await getActor();
  logRequest(request, requestId, actor?.actorId);

  const keySuffix = actor?.actorId ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const rateLimitedResponse = await enforceRequestRateLimit({
    request,
    requestId,
    key: `abuse:create:${keySuffix}`,
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (rateLimitedResponse) {
    return rateLimitedResponse;
  }

  try {
    const body: unknown = await request.json();
    const parsed = abuseReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const report = await db.abuseReport.create({
      data: {
        userId: actor?.actorId ?? null,
        category: parsed.data.category,
        message: redactText(parsed.data.message),
        email: parsed.data.email ? redactText(parsed.data.email) : null,
        metadata: parsed.data.metadata ? redactJson(parsed.data.metadata) : undefined,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ id: report.id, createdAt: report.createdAt }, { status: 201 });
  } catch (error) {
    reportError({ event: 'abuse.report.failed', error, requestId, data: { hasSession: Boolean(actor?.actorId) } });
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
