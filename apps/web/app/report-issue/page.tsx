'use client';

import { FormEvent, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

export default function ReportIssuePage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'bug' | 'security' | 'abuse' | 'other'>('bug');
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch('/api/abuse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, message, email: email || undefined }),
    });

    if (!response.ok) {
      setStatus('Unable to submit right now. Please try again.');
      return;
    }

    setMessage('');
    setEmail('');
    setCategory('bug');
    setStatus('Thanks — your report was submitted.');
  }

  return (
    <main className="mx-auto mt-10 max-w-2xl">
      <Card className="space-y-4">
        <h1>Report an issue</h1>
        <p className="text-sm text-muted-foreground">
          Share bugs, abuse, or security concerns. Do not include highly sensitive personal data.
        </p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Category
            <select
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2"
              value={category}
              onChange={(event) => setCategory(event.target.value as 'bug' | 'security' | 'abuse' | 'other')}
            >
              <option value="bug">Bug</option>
              <option value="security">Security</option>
              <option value="abuse">Abuse</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm">
            Contact email (optional)
            <Input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm">
            Message
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} required />
          </label>
          <Button type="submit">Submit report</Button>
        </form>
        {status ? <p className="text-sm">{status}</p> : null}
      </Card>
    </main>
  );
}
