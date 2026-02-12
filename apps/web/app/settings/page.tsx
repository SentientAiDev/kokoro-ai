import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { SignOutButton } from '../../components/sign-out-button';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';

export default async function SettingsPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="/settings" userEmail={session.user.email}>
      <section className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        </div>

        <Card className="space-y-2">
          <h2 className="text-base">Daily habit goal</h2>
          <p className="text-sm text-muted-foreground">Keep journaling lightweight: one short reflection each day, about two minutes total.</p>
        </Card>

        <SignOutButton />
      </section>
    </AppShell>
  );
}
