import { redirect } from 'next/navigation';
import { RecallView } from '../../components/recall-view';
import { AppShell } from '../../components/app-shell';
import { getActor } from '../../lib/actor';

export default async function MemoryPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  return (
    <AppShell activePath="/memory" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-2">
        <h1>Memory</h1>
        <p className="text-sm text-muted-foreground">Search and manage episodic and preference memories with full transparency.</p>
      </section>
      <div className="mt-6"><RecallView /></div>
    </AppShell>
  );
}
