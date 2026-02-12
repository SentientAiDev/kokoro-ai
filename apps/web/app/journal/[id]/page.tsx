import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthSession } from '../../../lib/auth';
import { getJournalEntryById, getUserIdByEmail } from '../../../lib/journal';

type JournalEntryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function JournalEntryPage({ params }: JournalEntryPageProps) {
  const session = await getAuthSession();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const userId = await getUserIdByEmail(session.user.email);

  if (!userId) {
    redirect('/login');
  }

  const { id } = await params;
  const entry = await getJournalEntryById(id, userId);

  if (!entry) {
    notFound();
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 720 }}>
      <p>
        <Link href="/journal">← Back to journal</Link>
      </p>
      <h1>Entry detail</h1>
      <p>
        <strong>Created:</strong> {entry.createdAt.toLocaleString()}
      </p>
      <p>
        <strong>Last updated:</strong> {entry.updatedAt.toLocaleString()}
      </p>
      <article style={{ whiteSpace: 'pre-wrap' }}>{entry.content}</article>
    </main>
  );
}
