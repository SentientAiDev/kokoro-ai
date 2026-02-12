'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';

type RecallItem = {
  id: string;
  memoryType: 'episodic' | 'preference';
  sourceDate: string;
  content: string;
  reason: 'query match' | 'topic overlap' | 'open loop';
  journalEntryId: string | null;
  whyShown: string;
};

function groupByDay(items: RecallItem[]) {
  return items.reduce<Record<string, RecallItem[]>>((accumulator, item) => {
    const label = new Date(item.sourceDate).toLocaleDateString();
    if (!accumulator[label]) {
      accumulator[label] = [];
    }

    accumulator[label].push(item);
    return accumulator;
  }, {});
}

export function RecallView() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RecallItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadItems(activeQuery: string) {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/recall?q=${encodeURIComponent(activeQuery)}`);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? 'Unable to load recall results');
      setLoading(false);
      return;
    }

    const payload = (await response.json()) as { items: RecallItem[] };
    setItems(payload.items);
    setLoading(false);
  }

  useEffect(() => {
    void loadItems('');
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadItems(query);
  }

  async function handleDelete(item: RecallItem) {
    const confirmed = window.confirm('Delete this memory item? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/memory/${item.memoryType}/${item.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? 'Unable to delete memory item');
      return;
    }

    await loadItems(query);
  }

  const groupedItems = useMemo(() => groupByDay(items), [items]);
  const dateGroups = Object.entries(groupedItems);

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search episodic and preference memory"
          aria-label="Search memories"
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>

      {error ? (
        <p role="alert" style={{ margin: 0, color: '#b00020' }}>
          {error}
        </p>
      ) : null}

      {loading ? <p>Loading memory timeline…</p> : null}

      {!loading && dateGroups.length === 0 ? <p>No recalled memories found.</p> : null}

      {!loading
        ? dateGroups.map(([dateLabel, dayItems]) => (
            <section key={dateLabel}>
              <h2>{dateLabel}</h2>
              <ul style={{ display: 'grid', gap: '0.75rem', paddingLeft: '1.25rem' }}>
                {dayItems.map((item) => (
                  <li key={item.id}>
                    <p style={{ margin: '0 0 0.25rem 0' }}>{item.content}</p>
                    <button type="button" onClick={() => void handleDelete(item)}>
                      Delete
                    </button>
                    <details style={{ marginTop: '0.35rem' }}>
                      <summary>Why am I seeing this?</summary>
                      <ul>
                        <li>Memory type: {item.memoryType}</li>
                        <li>Source date: {new Date(item.sourceDate).toLocaleString()}</li>
                        <li>Reason: {item.reason}</li>
                        <li>{item.whyShown}</li>
                        {item.memoryType === 'episodic' && item.journalEntryId ? (
                          <li>
                            <Link href={`/journal/${item.journalEntryId}`}>Open original journal entry</Link>
                          </li>
                        ) : null}
                      </ul>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))
        : null}
    </section>
  );
}
