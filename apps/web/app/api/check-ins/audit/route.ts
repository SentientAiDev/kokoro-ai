import { NextResponse } from 'next/server';
import { getActor } from '../../../../lib/actor';
import { prisma } from '../../../../lib/prisma';

type AuditDb = {
  auditLog: {
    findMany(args: {
      where: { userId: string; entityType: 'CheckInSuggestion' };
      orderBy: { createdAt: 'desc' };
      take: number;
      select: { action: true; createdAt: true; entityId: true };
    }): Promise<Array<{ action: string; createdAt: Date; entityId: string | null }>>;
  };
};

const db = prisma as unknown as AuditDb;

export async function GET() {
  const actor = await getActor();

  if (!actor?.actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await db.auditLog.findMany({
    where: { userId: actor.actorId, entityType: 'CheckInSuggestion' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { action: true, createdAt: true, entityId: true },
  });

  return NextResponse.json({ events }, { status: 200 });
}
