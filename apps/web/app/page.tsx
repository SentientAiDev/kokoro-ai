import React from 'react';
import Link from 'next/link';
import { appName } from '@kokoro/shared';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function HomePage() {
  return (
    <main className="mx-auto mt-16 grid max-w-3xl gap-4 px-4">
      <Card className="space-y-5 border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <h1>{appName}</h1>
          <p className="text-sm text-muted-foreground">
            Your personal AI with continuity: quick daily journaling, thoughtful memory recap, and transparent recall.
          </p>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Write a short reflection.</li>
          <li>Kokoro turns it into memory.</li>
          <li>Kokoro recalls context when it helps.</li>
          <li>Optional check-ins stay off by default.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Link href="/login">
            <Button>Sign in with magic link</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
