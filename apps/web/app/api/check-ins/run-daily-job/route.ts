import { NextResponse } from 'next/server';
import { runDailyCheckInScheduler } from '../../../../lib/check-ins';

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await runDailyCheckInScheduler();

  return NextResponse.json(result, { status: 200 });
}
