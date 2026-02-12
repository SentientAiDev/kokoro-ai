import React from 'react';
import Link from 'next/link';
import { appName } from '@kokoro/shared';
import { Button } from '../components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto mt-20 max-w-2xl space-y-4 rounded-xl border border-border bg-white p-8 shadow-sm">
      <h1>{appName}</h1>
      <p className="text-sm text-muted-foreground">Persistent personal AI companion with memory continuity.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/login">
          <Button>Sign in with magic link</Button>
        </Link>
        <Link href="/journal">
          <Button variant="outline">Open app</Button>
        </Link>
      </div>
    </main>
  );
}
