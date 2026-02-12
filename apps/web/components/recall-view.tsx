'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useToast } from './ui/toast';

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

function highlightMatch(text: string, query: string) {
  if (!query.trim()) {
    return text;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${escaped})`, 'ig');
  return text.split(pattern).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5"> 
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}


export function RecallView() {
  const { pushToast } = useToast();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<RecallItem[]>([]);
  const [activeItem, setActiveItem] = useState<RecallItem | null>(null);
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
      const message = payload.error ?? 'Unable to delete memory item';
      setError(message);
      pushToast(message, 'error');
      return;
    }

    pushToast('Memory item deleted.');
    await loadItems(query);
    setActiveItem(null);
  }

  const groupedItems = useMemo(() => groupByDay(items), [items]);
  const dateGroups = Object.entries(groupedItems);

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search episodic and preference memory"
            aria-label="Search memories"
          />
          <Button type="submit">Search</Button>
        </form>

        {error ? (
          <Card role="alert" className="border-red-200 text-sm text-red-700">
            {error}
          </Card>
        ) : null}

        {loading ? <Card className="text-sm text-muted-foreground">Loading memory timeline…</Card> : null}

        {!loading && dateGroups.length === 0 ? (
          <Card className="text-sm text-muted-foreground">No memory results yet. Try a broader query.</Card>
        ) : null}

        {!loading && dateGroups.length > 0
          ? dateGroups.map(([dateLabel, dayItems]) => (
              <section key={dateLabel} className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-700">{dateLabel}</h3>
                <ul className="grid gap-2">
                  {dayItems.map((item) => (
                    <li key={item.id}>
                      <Card className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm leading-6">{highlightMatch(item.content, query)}</p>
                          <Badge>{item.memoryType}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => setActiveItem(item)}>
                            Why this memory?
                          </Button>
                          <Button type="button" variant="destructive" onClick={() => void handleDelete(item)}>
                            Delete
                          </Button>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          : null}
      </div>

      <aside className="h-fit">
        <Card className="sticky top-4 space-y-2">
          <h3>Why this memory?</h3>
          <p className="text-xs text-muted-foreground">Every recall includes source context and controls.</p>
          {!activeItem ? (
            <p className="text-sm text-muted-foreground">Select a memory to inspect why it was recalled.</p>
          ) : (
            <>
              <p className="text-sm"><strong>Type:</strong> {activeItem.memoryType}</p>
              <p className="text-sm"><strong>Reason:</strong> {activeItem.reason}</p>
              <p className="text-sm text-muted-foreground">{activeItem.whyShown}</p>
              <p className="text-sm text-muted-foreground"><strong>Source date:</strong> {new Date(activeItem.sourceDate).toLocaleString()}</p>
              {activeItem.memoryType === 'episodic' && activeItem.journalEntryId ? (
                <Link href={`/journal/${activeItem.journalEntryId}`} className="text-sm text-primary hover:underline">
                  Open original journal entry
                </Link>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="button" variant="destructive" onClick={() => void handleDelete(activeItem)}>
                  {activeItem.memoryType === 'preference' ? 'Forget preference' : 'Delete memory'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </aside>
    </section>
  );
}
