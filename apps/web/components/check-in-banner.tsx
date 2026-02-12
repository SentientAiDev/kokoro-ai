'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useToast } from './ui/toast';
import { formatRetryHint, parseApiError } from '../lib/client/http';

type Suggestion = {
  id: string;
  message: string;
  why: string;
  reasonDetails: {
    openLoops: Array<{ summaryId: string; summary: string; loop: string }>;
    inactivityDays: number | null;
    sourceSummaryIds: string[];
  };
};

export function CheckInBanner() {
  const { pushToast } = useToast();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);

    try {
      const response = await fetch('/api/check-ins/suggestions');

      if (!response.ok) {
        const apiError = await parseApiError(response, 'Unable to load check-in suggestions.');
        const retryHint = formatRetryHint(apiError.retryAfterMs);
        setError(retryHint ? `${apiError.message} ${retryHint}` : apiError.message);
        return;
      }

      const data = (await response.json()) as { suggestions: Suggestion[] };
      setSuggestion(data.suggestions[0] ?? null);
    } catch {
      setError('Network issue while loading check-ins. Please retry.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function applyAction(action: 'dismiss' | 'snooze' | 'done') {
    if (!suggestion) {
      return;
    }

    try {
      const response = await fetch(`/api/check-ins/suggestions/${suggestion.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const apiError = await parseApiError(response, 'Unable to apply action.');
        const retryHint = formatRetryHint(apiError.retryAfterMs);
        pushToast(retryHint ? `${apiError.message} ${retryHint}` : apiError.message, 'error');
        return;
      }

      pushToast('Check-in updated.');
      await load();
    } catch {
      pushToast('Network issue while updating check-ins. Please retry.', 'error');
    }
  }

  if (!suggestion) {
    return (
      <Card className="space-y-2 text-sm text-muted-foreground">
        {error ? <p className="m-0 text-red-700">{error}</p> : null}
        <p className="m-0">No active check-in suggestions right now. We&apos;ll surface one if a configured trigger appears.</p>
        {error ? (
          <Button type="button" variant="outline" onClick={() => void load()}>
            Retry
          </Button>
        ) : null}
      </Card>
    );
  }

  return (
    <Card aria-label="Notification center" className="space-y-3">
      <h2 className="text-base">Check-in suggestion</h2>
      <p className="text-sm">{suggestion.message}</p>
      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer">Why this check-in?</summary>
        <p className="mt-2">{suggestion.why}</p>
        {suggestion.reasonDetails.openLoops.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {suggestion.reasonDetails.openLoops.map((loop) => (
              <li key={`${loop.summaryId}-${loop.loop}`}>
                <strong>Open loop:</strong> {loop.loop}
              </li>
            ))}
          </ul>
        ) : null}
      </details>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void applyAction('dismiss')}>
          Dismiss
        </Button>
        <Button type="button" variant="outline" onClick={() => void applyAction('snooze')}>
          Snooze
        </Button>
        <Button type="button" onClick={() => void applyAction('done')}>
          Mark done
        </Button>
      </div>
    </Card>
  );
}
