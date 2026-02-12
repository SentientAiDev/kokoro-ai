import { redirect } from 'next/navigation';
import { RecallView } from '../../components/recall-view';
import { getAuthSession } from '../../lib/auth';
import { AppShell } from '../../components/app-shell';

export default async function TimelinePage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="/timeline" userEmail={session.user.email}>
      <section className="space-y-2">
        <h1>Timeline</h1>
        <p className="text-sm text-muted-foreground">Browse your memory timeline with search and deletion controls.</p>
      </section>
      <div className="mt-6">
        <RecallView />
      </div>
    </AppShell>
  );
}
