import { redirect } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { DeleteAllMemoriesButton } from '../../components/delete-all-memories-button';
import { getAuthSession } from '../../lib/auth';

export default async function TrustCenterPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="" userEmail={session.user.email}>
      <section className="space-y-6">
        <div>
          <h1>Trust Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Clear controls for what Kokoro remembers and why.</p>
        </div>

        <Card className="space-y-2">
          <h2 className="text-base">What is stored</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Your journal entries and generated episodic summaries.</li>
            <li>Preference memories only when you explicitly consent.</li>
            <li>Check-in settings you configure.</li>
          </ul>
        </Card>

        <Card className="space-y-2">
          <h2 className="text-base">What is not stored by default</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Proactive check-ins are disabled until you opt in.</li>
            <li>No autonomous actions are taken without confirmation.</li>
            <li>Sensitive data is redacted in logs.</li>
          </ul>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-base">Danger zone</h2>
          <p className="text-sm text-muted-foreground">Need a clean slate? Remove all episodic and preference memories instantly.</p>
          <DeleteAllMemoriesButton />
        </Card>
      </section>
    </AppShell>
  );
}
