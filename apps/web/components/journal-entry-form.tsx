'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';

export function JournalEntryForm() {
  const router = useRouter();
  const { pushToast } = useToast();
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
      const message = payload.error ?? 'Unable to save entry';
      setError(message);
      pushToast(message, 'error');
      setIsSaving(false);
      return;
    }

    setContent('');
    setIsSaving(false);
    pushToast('Journal entry saved.');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <label htmlFor="journal-content" className="text-sm font-medium">
        Today&apos;s journal entry
      </label>
      <Textarea
        id="journal-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={8}
        maxLength={4000}
        required
        placeholder="What stood out today?"
      />
      {error ? (
        <p role="alert" className="m-0 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? 'Saving...' : 'Save entry'}
      </Button>
    </form>
  );
}
