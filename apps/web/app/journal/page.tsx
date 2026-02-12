import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthSession } from '../../lib/auth';
import { JournalEntryForm } from '../../components/journal-entry-form';
import { getUserIdByEmail, listJournalEntries } from '../../lib/journal';

export default async function JournalPage() {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    redirect('/login');
  }

  const entries = await listJournalEntries(userId);

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 720 }}>
      <h1>Journal</h1>
      <JournalEntryForm />
      <h2 style={{ marginTop: '2rem' }}>Past entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link href={`/journal/${entry.id}`}>
                {entry.createdAt.toLocaleString()} — {entry.content.slice(0, 80)}
                {entry.content.length > 80 ? '…' : ''}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
