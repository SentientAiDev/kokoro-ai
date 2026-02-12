'use client';

import { FormEvent, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useToast } from './ui/toast';

export function ReportIssueForm() {
  const { pushToast } = useToast();
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const response = await fetch('/api/abuse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'other',
        description,
        contactEmail: contactEmail || undefined,
        contextUrl: window.location.href,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      pushToast('Unable to submit report right now.', 'error');
      return;
    }

    setDescription('');
    setContactEmail('');
    pushToast('Thanks — your report has been submitted.');
  }

  return (
    <form id="report-issue" onSubmit={onSubmit} className="grid gap-3">
      <p className="text-sm text-muted-foreground">Report abuse, safety concerns, or harmful behavior.</p>
      <Input
        type="email"
        value={contactEmail}
        onChange={(event) => setContactEmail(event.target.value)}
        placeholder="Optional contact email"
      />
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        minLength={10}
        maxLength={2000}
        required
        placeholder="Describe the issue"
      />
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? 'Submitting…' : 'Submit report'}
      </Button>
    </form>
  );
}
