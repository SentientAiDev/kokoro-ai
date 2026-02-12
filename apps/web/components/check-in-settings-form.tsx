'use client';

import { FormEvent, useEffect, useState } from 'react';

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
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/check-ins/settings');

      if (!response.ok) {
        setStatus('Unable to load proactive check-in settings.');
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as SettingsState;
      setSettings(data);
      setIsLoading(false);
    })();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch('/api/check-ins/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      setStatus('Failed to save settings.');
      return;
    }

    setStatus('Saved proactive check-in settings.');
  }

  if (isLoading) {
    return <p>Loading check-in settings…</p>;
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
      <label>
        <input
          type="checkbox"
          checked={settings.proactiveCheckIns}
          onChange={(event) => setSettings({ ...settings, proactiveCheckIns: event.target.checked })}
        />{' '}
        Enable proactive check-ins
      </label>

      <label>
        Preferred window start
        <input
          type="time"
          value={settings.checkInWindowStart}
          onChange={(event) => setSettings({ ...settings, checkInWindowStart: event.target.value })}
        />
      </label>

      <label>
        Preferred window end
        <input
          type="time"
          value={settings.checkInWindowEnd}
          onChange={(event) => setSettings({ ...settings, checkInWindowEnd: event.target.value })}
        />
      </label>

      <label>
        Max suggestions per day
        <input
          type="number"
          min={1}
          max={10}
          value={settings.checkInMaxPerDay}
          onChange={(event) => setSettings({ ...settings, checkInMaxPerDay: Number(event.target.value) })}
        />
      </label>

      <label>
        Inactivity threshold (days)
        <input
          type="number"
          min={1}
          max={30}
          value={settings.checkInInactivityDays}
          onChange={(event) => setSettings({ ...settings, checkInInactivityDays: Number(event.target.value) })}
        />
      </label>

      <button type="submit" style={{ width: 'fit-content' }}>
        Save proactive check-ins
      </button>

      {status ? <p>{status}</p> : null}
    </form>
  );
}
