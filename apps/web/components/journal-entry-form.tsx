'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';
import { formatRetryHint, parseApiError } from '../lib/client/http';

export function JournalEntryForm({
  label = "Today's journal entry",
  placeholder = 'What stood out today?',
  rows = 8,
  submitLabel = 'Save entry',
  className,
  hideLabel = false,
}: {
  label?: string;
  placeholder?: string;
  rows?: number;
  submitLabel?: string;
  className?: string;
  hideLabel?: boolean;
} = {}) {
  const router = useRouter();
  const { pushToast } = useToast();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const apiError = await parseApiError(response, 'Unable to save entry right now.');
        const retryHint = formatRetryHint(apiError.retryAfterMs);
        const message = retryHint ? `${apiError.message} ${retryHint}` : apiError.message;
        setError(message);
        pushToast(message, 'error');
        setIsSaving(false);
        return;
      }

      setContent('');
      setIsSaving(false);
      pushToast('Journal entry saved.');
      router.refresh();
    } catch {
      const message = 'Network issue while saving. Please retry in a moment.';
      setError(message);
      pushToast(message, 'error');
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? 'grid gap-3'}>
      <label htmlFor="journal-content" className={hideLabel ? "sr-only" : "text-sm font-medium"}>{label}</label>
      <Textarea
        id="journal-content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={rows}
        maxLength={4000}
        required
        placeholder={placeholder}
      />
      {error ? (
        <p role="alert" className="m-0 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={isSaving} className="w-fit">
        {isSaving ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
