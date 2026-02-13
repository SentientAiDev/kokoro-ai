import { redirect } from 'next/navigation';
import { CheckInSettingsForm } from '../../components/check-in-settings-form';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { CheckInBanner } from '../../components/check-in-banner';
import { getActor } from '../../lib/actor';

export default async function CheckInsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  return (
    <AppShell activePath="/check-ins" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-6">
        <div><h1>Check-ins</h1><p className="mt-1 text-sm text-muted-foreground">Proactive support is always user-controlled and off by default.</p></div>
        <CheckInBanner />
        <Card className="space-y-3"><h2>Configure proactive check-ins</h2><CheckInSettingsForm /></Card>
      </section>
    </AppShell>
  );
}
