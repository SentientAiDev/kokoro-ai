import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { JournalEntryForm } from '../../components/journal-entry-form';
import { getActor } from '../../lib/actor';
import { prisma } from '../../lib/prisma';

// ...types unchanged
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
const entryPlaceholders = ['What happened today?', 'What’s on your mind?', 'Talk to Kokoro…'];
function placeholderForToday() { const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); return entryPlaceholders[daySeed % entryPlaceholders.length]; }
function firstOpenLoop(openLoops: unknown) { if (!Array.isArray(openLoops) || openLoops.length === 0) return null; const loop = openLoops[0]; return typeof loop === 'string' ? loop : null; }

export default async function TodayPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const latestSummary = await db.episodicSummary.findFirst({ where: { userId: actor.actorId }, orderBy: { createdAt: 'desc' }, select: { summary: true, createdAt: true, openLoops: true } });
  const openLoop = firstOpenLoop(latestSummary?.openLoops);
  const recap = latestSummary?.summary ? (latestSummary.summary.length > 180 ? `${latestSummary.summary.slice(0, 180)}…` : latestSummary.summary) : null;

  return (
    <AppShell activePath="/today" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-12 py-8">
        <header className="space-y-3 text-center"><h1 className="text-4xl font-semibold tracking-tight text-slate-900">Today</h1><p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">A calm space to capture the day as it unfolds.</p></header>
        <div className="space-y-8"><JournalEntryForm label="Today's journal entry" placeholder={placeholderForToday()} rows={12} submitLabel="Save to memory" className="grid gap-4" hideLabel />
          <div className="space-y-5 border-t border-slate-200 pt-6"><div className="space-y-2"><p className="text-xs uppercase tracking-wide text-slate-500">Gentle context</p>{recap ? <p className="text-sm leading-relaxed text-slate-700">{recap}</p> : <p className="text-sm text-muted-foreground">Your first recap appears here after you write today.</p>}</div>
            <div className="space-y-2"><p className="text-xs uppercase tracking-wide text-slate-500">One suggestion</p>{openLoop ? <p className="text-sm leading-relaxed text-slate-700">{openLoop}</p> : <p className="text-sm text-muted-foreground">No open loop yet. Keep writing and Kokoro will suggest one gentle next step.</p>}<Link href="/memory" className="text-xs text-slate-500 underline-offset-4 hover:underline">Why am I seeing this?</Link></div></div>
        </div>
      </section>
    </AppShell>
  );
}
