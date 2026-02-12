'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export function JournalEntryForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? 'Unable to save entry');
      setIsSaving(false);
      return;
    }

    setContent('');
    setIsSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <label htmlFor="journal-content">Today&apos;s journal entry</label>
      <textarea
        id="journal-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={6}
        maxLength={4000}
        required
      />
      {error ? (
        <p role="alert" style={{ color: '#b00020', margin: 0 }}>
          {error}
        </p>
      ) : null}
      <button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save entry'}
      </button>
    </form>
  );
}
