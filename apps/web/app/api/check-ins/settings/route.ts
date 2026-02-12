import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthSession } from '../../../../lib/auth';
import { getCheckInSettings, updateCheckInSettings } from '../../../../lib/check-ins';

const settingsSchema = z.object({
  proactiveCheckIns: z.boolean(),
  checkInWindowStart: z.string().regex(/^\d{2}:\d{2}$/),
  checkInWindowEnd: z.string().regex(/^\d{2}:\d{2}$/),
  checkInMaxPerDay: z.number().int().min(1).max(10),
  checkInInactivityDays: z.number().int().min(1).max(30),
});

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getCheckInSettings(session.user.id);

  return NextResponse.json(settings, { status: 200 });
}

export async function PUT(request: Request) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = await updateCheckInSettings(session.user.id, parsed.data);

  return NextResponse.json(settings, { status: 200 });
}
