import { redirect } from 'next/navigation';
import { SignOutButton } from '../../components/sign-out-button';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';
import { getActor } from '../../lib/actor';
import { ResetGuestDataButton } from '../../components/reset-guest-data-button';

export default async function SettingsPage() {
  const actor = await getActor();
  if (!actor) redirect('/login');

  return (
    <AppShell activePath="/settings" userLabel={actor.kind === 'GUEST' ? 'Guest (local device)' : 'Signed in'} isGuest={actor.kind === 'GUEST'}>
      <section className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{actor.kind === 'GUEST' ? 'Guest mode: data is local to this browser until you sign in.' : 'Account sync enabled.'}</p>
        </div>

        <Card className="space-y-2">
          <h2 className="text-base">Daily habit goal</h2>
          <p className="text-sm text-muted-foreground">Keep journaling lightweight: one short reflection each day, about two minutes total.</p>
        </Card>

        {actor.kind === 'GUEST' ? <ResetGuestDataButton /> : <SignOutButton />}
      </section>
    </AppShell>
  );
}
