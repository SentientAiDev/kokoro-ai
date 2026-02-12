import { redirect } from 'next/navigation';
import { RecallView } from '../../components/recall-view';
import { getAuthSession } from '../../lib/auth';
import { AppShell } from '../../components/app-shell';

export default async function MemoryPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="/memory" userEmail={session.user.email}>
      <section className="space-y-2">
        <h1>Memory</h1>
        <p className="text-sm text-muted-foreground">Search and manage episodic and preference memories with full transparency.</p>
      </section>
      <div className="mt-6">
        <RecallView />
      </div>
    </AppShell>
  );
}
