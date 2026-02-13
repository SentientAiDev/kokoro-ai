import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getJournalEntryById } from '../../../lib/journal';
import { AppShell } from '../../../components/app-shell';
import { Card } from '../../../components/ui/card';
import { getActor } from '../../../lib/actor';

type JournalEntryPageProps = { params: Promise<{ id: string }> };

export default async function JournalEntryPage({ params }: JournalEntryPageProps) {
  const actor = await getActor();
  if (!actor) redirect('/login');

  const { id } = await params;
  const entry = await getJournalEntryById(id, actor.actorId);
  if (!entry) notFound();

  return (
    <AppShell activePath="/journal" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-4">
        <Link href="/journal" className="text-sm text-slate-600 hover:underline">← Back to journal</Link>
        <h1>Entry detail</h1>
        <Card className="space-y-2 text-sm"><p><strong>Created:</strong> {entry.createdAt.toLocaleString()}</p><p><strong>Last updated:</strong> {entry.updatedAt.toLocaleString()}</p></Card>
        <Card><article className="whitespace-pre-wrap leading-7">{entry.content}</article></Card>
      </section>
    </AppShell>
  );
}
