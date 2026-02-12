import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
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
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = await db.auditLog.findMany({
    where: { userId: session.user.id, entityType: 'CheckInSuggestion' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { action: true, createdAt: true, entityId: true },
  });

  return NextResponse.json({ events }, { status: 200 });
}
