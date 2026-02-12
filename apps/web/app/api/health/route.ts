import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

type HealthDb = {
  $queryRawUnsafe(query: string): Promise<unknown>;
};

const db = prisma as unknown as HealthDb;

export async function GET() {
  try {
    await db.$queryRawUnsafe('SELECT 1');

    return NextResponse.json(
      {
        status: 'ok',
        service: 'kokoro-web',
        db: 'ok',
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'kokoro-web',
        db: 'down',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
