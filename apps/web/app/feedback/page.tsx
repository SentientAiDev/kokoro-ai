'use client';

import { FormEvent, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

export default function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        email: email || undefined,
        page: '/feedback',
      }),
    });

    if (!response.ok) {
      setStatus('Unable to send feedback right now. Please try again.');
      return;
    }

    setMessage('');
    setEmail('');
    setStatus('Thanks — we received your feedback.');
  }

  return (
    <main className="mx-auto mt-10 max-w-2xl">
      <Card className="space-y-4">
        <h1>Send feedback</h1>
        <p className="text-sm text-muted-foreground">
          Tell us what feels useful, confusing, or missing. Please avoid secrets or highly sensitive personal details.
        </p>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm">
            Contact email (optional)
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm">
            Feedback
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <Button type="submit">Send feedback</Button>
        </form>
        {status ? <p className="text-sm">{status}</p> : null}
      </Card>
    </main>
  );
}
