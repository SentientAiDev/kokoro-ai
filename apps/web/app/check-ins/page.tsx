import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { CheckInSettingsForm } from '../../components/check-in-settings-form';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { CheckInBanner } from '../../components/check-in-banner';

export default async function CheckInsPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="/check-ins" userEmail={session.user.email}>
      <section className="space-y-6">
        <div>
          <h1>Check-ins</h1>
          <p className="mt-1 text-sm text-muted-foreground">Proactive support is always user-controlled and off by default.</p>
        </div>
        <CheckInBanner />
        <Card className="space-y-3">
          <h2>Configure proactive check-ins</h2>
          <CheckInSettingsForm />
        </Card>
      </section>
    </AppShell>
  );
}
