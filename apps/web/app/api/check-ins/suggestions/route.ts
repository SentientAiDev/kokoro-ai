import { NextResponse } from 'next/server';
import { getAuthSession } from '../../../../lib/auth';
import { listActiveCheckInSuggestions } from '../../../../lib/check-ins';

export async function GET() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const suggestions = await listActiveCheckInSuggestions(session.user.id);

  return NextResponse.json({ suggestions }, { status: 200 });
}
