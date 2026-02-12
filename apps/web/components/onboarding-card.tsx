'use client';

import { FormEvent, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { useToast } from './ui/toast';

type Tone = 'calm' | 'direct';

export function OnboardingCard() {
  const { pushToast } = useToast();
  const [tone, setTone] = useState<Tone>('calm');
  const [preferredStartHour, setPreferredStartHour] = useState('09:00');
  const [preferredEndHour, setPreferredEndHour] = useState('20:00');
  const [isSaving, setIsSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const [settingsResponse, toneResponse] = await Promise.all([
      fetch('/api/check-ins/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proactiveCheckIns: false,
          checkInWindowStart: preferredStartHour,
          checkInWindowEnd: preferredEndHour,
          checkInMaxPerDay: 1,
          checkInInactivityDays: 3,
        }),
      }),
      fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'assistant_tone',
          value: tone,
          source: 'Onboarding preference',
          consentGranted: true,
        }),
      }),
    ]);

    if (!settingsResponse.ok || !toneResponse.ok) {
      pushToast('Unable to save onboarding preferences right now.', 'error');
      setIsSaving(false);
      return;
    }

    setComplete(true);
    setIsSaving(false);
    pushToast('Welcome to Kokoro. Preferences saved.');
  }

  return (
    <Card className="space-y-4 border-slate-200 bg-slate-50/70">
      <div>
        <h2>Start with a calm two-minute rhythm</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Journal briefly, Kokoro creates a memory recap, recalls what matters, then offers optional check-ins.
        </p>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Write a quick note about your day.</li>
        <li>Kokoro turns it into a memory summary.</li>
        <li>You can inspect exactly why each memory appears.</li>
        <li>Check-ins stay off by default until you enable them.</li>
      </ol>

      {complete ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          You&apos;re set. You can update these choices any time in Settings.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="grid gap-3">
          <fieldset className="grid gap-2 text-sm">
            <legend className="font-medium">Preferred tone (optional)</legend>
            <label className="flex items-center gap-2 rounded border border-border bg-white px-3 py-2">
              <input type="radio" checked={tone === 'calm'} onChange={() => setTone('calm')} />
              Calm
            </label>
            <label className="flex items-center gap-2 rounded border border-border bg-white px-3 py-2">
              <input type="radio" checked={tone === 'direct'} onChange={() => setTone('direct')} />
              Direct
            </label>
          </fieldset>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Preferred hours start
              <Input type="time" value={preferredStartHour} onChange={(event) => setPreferredStartHour(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">
              Preferred hours end
              <Input type="time" value={preferredEndHour} onChange={(event) => setPreferredEndHour(event.target.value)} />
            </label>
          </div>

          <Button type="submit" className="w-fit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save onboarding choices'}
          </Button>
        </form>
      )}
    </Card>
  );
}
