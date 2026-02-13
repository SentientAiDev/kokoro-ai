import Link from 'next/link';
import { redirect } from 'next/navigation';
import { JournalEntryForm } from '../../components/journal-entry-form';
import { listJournalEntries } from '../../lib/journal';
import { CheckInBanner } from '../../components/check-in-banner';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { getActor } from '../../lib/actor';

export default async function JournalPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');
  const entries = await listJournalEntries(actor.actorId);

  return (
    <AppShell activePath="/journal" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-6">
        <div><h1>Journal</h1><p className="mt-1 text-sm text-muted-foreground">Capture your day and build episodic memory over time.</p></div>
        <CheckInBanner />
        <Card><JournalEntryForm /></Card>
        <section className="space-y-3"><h2>Past entries</h2>{entries.length === 0 ? (<Card className="text-sm text-muted-foreground">No entries yet. Write your first note above.</Card>) : (
          <ul className="grid gap-3">{entries.map((entry) => (<li key={entry.id}><Card><Link href={`/journal/${entry.id}`} className="block text-sm hover:underline"><p className="mb-1 text-xs text-muted-foreground">{entry.createdAt.toLocaleString()}</p>{entry.content.slice(0, 160)}{entry.content.length > 160 ? '…' : ''}</Link></Card></li>))}</ul>
        )}</section>
      </section>
    </AppShell>
  );
}
