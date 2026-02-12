import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { enforceRateLimit } from '../../../lib/api-security';
import { abuseReportSchema } from '../../../lib/validation/api';
import { redactSensitiveJson } from '../../../lib/sensitive-data';

export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = await enforceRateLimit({
    key: `abuse:report:${session.user.id}`,
    scope: 'abuse.report',
    subjectId: session.user.id,
    maxRequests: 5,
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

  const parsed = abuseReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const db = prisma as unknown as { auditLog: { create(args: { data: { userId: string; action: string; entityType: string; entityId: null; metadata: unknown }; select: { id: true; createdAt: true } }): Promise<{ id: string; createdAt: Date }> } };

  const event = await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'abuse.reported',
      entityType: 'AbuseReport',
      entityId: null,
      metadata: redactSensitiveJson(parsed.data),
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ id: event.id, createdAt: event.createdAt }, { status: 201 });
}
