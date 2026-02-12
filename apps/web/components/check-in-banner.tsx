'use client';

import { useEffect, useState } from 'react';

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
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  async function load() {
    const response = await fetch('/api/check-ins/suggestions');

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { suggestions: Suggestion[] };
    setSuggestion(data.suggestions[0] ?? null);
  }

  useEffect(() => {
    void load();
  }, []);

  async function applyAction(action: 'dismiss' | 'snooze' | 'done') {
    if (!suggestion) {
      return;
    }

    const response = await fetch(`/api/check-ins/suggestions/${suggestion.id}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });

    if (!response.ok) {
      return;
    }

    await load();
  }

  if (!suggestion) {
    return null;
  }

  return (
    <section
      style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}
      aria-label="Notification center"
    >
      <h2 style={{ marginTop: 0 }}>Check-in suggestion</h2>
      <p>{suggestion.message}</p>
      <details>
        <summary>Why this check-in?</summary>
        <p>{suggestion.why}</p>
        {suggestion.reasonDetails.openLoops.length > 0 ? (
          <ul>
            {suggestion.reasonDetails.openLoops.map((loop) => (
              <li key={`${loop.summaryId}-${loop.loop}`}>
                <strong>Open loop:</strong> {loop.loop}
              </li>
            ))}
          </ul>
        ) : null}
        {suggestion.reasonDetails.inactivityDays !== null ? (
          <p>Inactivity: {suggestion.reasonDetails.inactivityDays} days since your latest journal entry.</p>
        ) : null}
      </details>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="button" onClick={() => void applyAction('dismiss')}>
          Dismiss
        </button>
        <button type="button" onClick={() => void applyAction('snooze')}>
          Snooze
        </button>
        <button type="button" onClick={() => void applyAction('done')}>
          Mark done
        </button>
      </div>
    </section>
  );
}
