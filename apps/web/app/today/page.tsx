import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { OnboardingCard } from '../../components/onboarding-card';
import { CheckInBanner } from '../../components/check-in-banner';
import { getAuthSession } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

type TodayDb = {
  journalEntry: {
    count(args: { where: { userId: string } }): Promise<number>;
  };
  episodicSummary: {
    findFirst(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: { summary: true; createdAt: true; openLoops: true };
    }): Promise<{ summary: string; createdAt: Date; openLoops: unknown } | null>;
  };
};

const db = prisma as unknown as TodayDb;

const prompts = [
  'What felt meaningful today?',
  'What deserves your attention next?',
  'What small win do you want to remember?',
  'What would make tomorrow 1% easier?',
];

function promptForToday() {
  const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return prompts[daySeed % prompts.length];
}

function firstOpenLoop(openLoops: unknown) {
  if (!Array.isArray(openLoops) || openLoops.length === 0) {
    return null;
  }

  const loop = openLoops[0];
  return typeof loop === 'string' ? loop : null;
}

export default async function TodayPage() {
  const session = await getAuthSession();

  if (!session?.user?.id || !session.user.email) {
    redirect('/login');
  }

  const [entryCount, latestSummary] = await Promise.all([
    db.journalEntry.count({ where: { userId: session.user.id } }),
    db.episodicSummary.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { summary: true, createdAt: true, openLoops: true },
    }),
  ]);

  const openLoop = firstOpenLoop(latestSummary?.openLoops);

  return (
    <AppShell activePath="/today" userEmail={session.user.email}>
      <section className="space-y-6">
        <div className="space-y-2">
          <h1>Today</h1>
          <p className="text-sm text-muted-foreground">
            Kokoro helps you capture your day in under two minutes so future-you remembers what matters.
          </p>
        </div>

        {entryCount === 0 ? <OnboardingCard /> : null}

        <Card className="space-y-4 border-slate-200 bg-white shadow-sm">
          <p className="text-sm font-medium text-slate-600">Your 2-minute loop</p>
          <Link href="/journal" className="block">
            <Button className="h-14 w-full text-base">Talk / Write to Kokoro</Button>
          </Link>
          <p className="text-sm text-muted-foreground">Today&apos;s prompt: {promptForToday()}</p>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-2">
            <h2 className="text-base">Yesterday&apos;s summary</h2>
            {!latestSummary ? (
              <p className="text-sm text-muted-foreground">No recap yet. Write your first entry to generate memory.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{new Date(latestSummary.createdAt).toLocaleString()}</p>
                <p className="text-sm">{latestSummary.summary}</p>
              </>
            )}
          </Card>
          <Card className="space-y-2">
            <h2 className="text-base">Suggested next step</h2>
            {!openLoop ? (
              <p className="text-sm text-muted-foreground">
                No open loop right now. Keep journaling and Kokoro will surface one gentle next step.
              </p>
            ) : (
              <>
                <p className="text-sm">{openLoop}</p>
                <Link href="/journal" className="text-sm text-primary hover:underline">
                  Capture progress in your journal
                </Link>
              </>
            )}
          </Card>
        </div>

        <CheckInBanner />
      </section>
    </AppShell>
  );
}
