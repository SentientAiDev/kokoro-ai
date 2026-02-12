import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { SignOutButton } from '../../components/sign-out-button';

export default async function AccountPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 560 }}>
      <h1>Account</h1>
      <p>Signed in as {session.user.email}</p>
      <SignOutButton />
    </main>
  );
}
