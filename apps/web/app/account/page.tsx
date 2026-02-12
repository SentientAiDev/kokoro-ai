import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { SignOutButton } from '../../components/sign-out-button';
import { CheckInSettingsForm } from '../../components/check-in-settings-form';

export default async function AccountPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 560 }}>
      <h1>Account</h1>
      <p>Signed in as {session.user.email}</p>
      <section style={{ marginTop: '2rem' }}>
        <h2>Proactive check-ins</h2>
        <p>All proactive suggestions are off by default and only appear in-app.</p>
        <CheckInSettingsForm />
      </section>
      <SignOutButton />
    </main>
  );
}
