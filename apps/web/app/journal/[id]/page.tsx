import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getAuthSession } from '../../../lib/auth';
import { getJournalEntryById, getUserIdByEmail } from '../../../lib/journal';
import { AppShell } from '../../../components/app-shell';
import { Card } from '../../../components/ui/card';

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
    <AppShell activePath="/journal" userEmail={session.user.email}>
      <section className="space-y-4">
        <Link href="/journal" className="text-sm text-slate-600 hover:underline">
          ← Back to journal
        </Link>
        <h1>Entry detail</h1>
        <Card className="space-y-2 text-sm">
          <p>
            <strong>Created:</strong> {entry.createdAt.toLocaleString()}
          </p>
          <p>
            <strong>Last updated:</strong> {entry.updatedAt.toLocaleString()}
          </p>
        </Card>
        <Card>
          <article className="whitespace-pre-wrap leading-7">{entry.content}</article>
        </Card>
      </section>
    </AppShell>
  );
}
