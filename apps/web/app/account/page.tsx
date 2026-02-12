import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { SignOutButton } from '../../components/sign-out-button';
import { CheckInSettingsForm } from '../../components/check-in-settings-form';
import { AppShell } from '../../components/app-shell';
import { Card } from '../../components/ui/card';

export default async function AccountPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <AppShell activePath="/account" userEmail={session.user.email}>
      <section className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {session.user.email}</p>
        </div>
        <Card className="space-y-3">
          <h2>Proactive check-ins</h2>
          <p className="text-sm text-muted-foreground">
            All proactive suggestions are off by default and only appear in-app.
          </p>
          <CheckInSettingsForm />
        </Card>
        <SignOutButton />
      </section>
    </AppShell>
  );
}
