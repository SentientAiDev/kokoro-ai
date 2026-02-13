'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';

export function ResetGuestDataButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleReset() {
    setIsSubmitting(true);
    await fetch('/api/guest/reset', { method: 'POST' });
    setIsSubmitting(false);
    router.push('/today');
    router.refresh();
  }

  return (
    <Button type="button" variant="destructive" disabled={isSubmitting} onClick={handleReset}>
      {isSubmitting ? 'Resetting…' : 'Reset guest data'}
    </Button>
  );
}
