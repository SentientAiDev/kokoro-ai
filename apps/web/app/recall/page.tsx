import Link from 'next/link';
import { RecallView } from '../../components/recall-view';

export default function RecallPage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 760 }}>
      <h1>Memory recall</h1>
      <p>Search and review your episodic summaries and saved preference memories.</p>
      <RecallView />
      <p>
        <Link href="/">Back home</Link>
      </p>
    </main>
  );
}
