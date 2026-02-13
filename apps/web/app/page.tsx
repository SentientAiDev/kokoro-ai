import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { appName } from '@kokoro/shared';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

const screenshotCards = [
  {
    src: '/screenshots/today.svg',
    title: 'Daily journal capture',
    description: 'Quick reflection turns into structured memory without extra setup.',
  },
  {
    src: '/screenshots/memory.svg',
    title: 'Transparent memory recall',
    description: 'Every recalled memory explains why it appears and where it came from.',
  },
  {
    src: '/screenshots/checkins.svg',
    title: 'Configurable check-ins',
    description: 'Proactive notifications are fully user-controlled and off by default.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto mt-10 grid w-full max-w-6xl gap-6 px-4 pb-12">
      <Card className="space-y-6 border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Launching now</p>
          <h1 className="text-3xl font-semibold text-slate-900">{appName}: your AI that remembers life between chats.</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Build continuity with two mindful minutes a day: journal quickly, get transparent memory recall, and keep
            every proactive nudge under your control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/today">
            <Button>Continue in guest mode</Button>
          </Link>
          <Link href="/feedback">
            <Button variant="outline">Join waitlist / updates</Button>
          </Link>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {screenshotCards.map((card) => (
          <Card key={card.src} className="space-y-3 border-slate-200 bg-white p-4">
            <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <Image
                src={card.src}
                alt={card.title}
                width={1200}
                height={750}
                className="h-auto w-full"
                priority
              />
            </div>
            <h2 className="text-base font-medium">{card.title}</h2>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </Card>
        ))}
      </section>
    </main>
  );
}
