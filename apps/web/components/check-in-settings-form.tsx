'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/toast';
import { formatRetryHint, parseApiError } from '../lib/client/http';

type SettingsState = {
  proactiveCheckIns: boolean;
  checkInWindowStart: string;
  checkInWindowEnd: string;
  checkInMaxPerDay: number;
  checkInInactivityDays: number;
};

const defaultSettings: SettingsState = {
  proactiveCheckIns: false,
  checkInWindowStart: '09:00',
  checkInWindowEnd: '20:00',
  checkInMaxPerDay: 1,
  checkInInactivityDays: 3,
};

export function CheckInSettingsForm() {
  const { pushToast } = useToast();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  async function loadSettings() {
    try {
      const response = await fetch('/api/check-ins/settings');

      if (!response.ok) {
        const apiError = await parseApiError(response, 'Unable to load proactive check-in settings.');
        const retryHint = formatRetryHint(apiError.retryAfterMs);
        setStatus(retryHint ? `${apiError.message} ${retryHint}` : apiError.message);
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as SettingsState;
      setSettings(data);
      setIsLoading(false);
    } catch {
      setStatus('Network issue while loading settings. Please retry.');
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    try {
      const response = await fetch('/api/check-ins/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const apiError = await parseApiError(response, 'Failed to save settings.');
        const retryHint = formatRetryHint(apiError.retryAfterMs);
        const message = retryHint ? `${apiError.message} ${retryHint}` : apiError.message;
        setStatus(message);
        pushToast(message, 'error');
        return;
      }

      setStatus('Saved proactive check-in settings.');
      pushToast('Settings saved.');
    } catch {
      const message = 'Network issue while saving settings. Please retry.';
      setStatus(message);
      pushToast(message, 'error');
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading check-in settings…</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 text-sm">
      <label className="flex items-center gap-2 rounded-md border border-border bg-white p-3">
        <input
          type="checkbox"
          checked={settings.proactiveCheckIns}
          onChange={(event) => setSettings({ ...settings, proactiveCheckIns: event.target.checked })}
        />
        Enable proactive check-ins
      </label>

      <label className="grid gap-1">
        Preferred window start
        <Input
          type="time"
          value={settings.checkInWindowStart}
          onChange={(event) => setSettings({ ...settings, checkInWindowStart: event.target.value })}
        />
      </label>

      <label className="grid gap-1">
        Preferred window end
        <Input
          type="time"
          value={settings.checkInWindowEnd}
          onChange={(event) => setSettings({ ...settings, checkInWindowEnd: event.target.value })}
        />
      </label>

      <label className="grid gap-1">
        Max suggestions per day
        <Input
          type="number"
          min={1}
          max={10}
          value={settings.checkInMaxPerDay}
          onChange={(event) => setSettings({ ...settings, checkInMaxPerDay: Number(event.target.value) })}
        />
      </label>

      <label className="grid gap-1">
        Inactivity threshold (days)
        <Input
          type="number"
          min={1}
          max={30}
          value={settings.checkInInactivityDays}
          onChange={(event) => setSettings({ ...settings, checkInInactivityDays: Number(event.target.value) })}
        />
      </label>

      <Button type="submit" className="w-fit">
        Save proactive check-ins
      </Button>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {status?.toLowerCase().includes('unable') || status?.toLowerCase().includes('network') ? (
        <Button type="button" variant="outline" className="w-fit" onClick={() => void loadSettings()}>
          Retry loading settings
        </Button>
      ) : null}
    </form>
  );
}
