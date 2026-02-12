'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function MagicLinkForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');

    if (typeof email !== 'string' || email.trim().length === 0) {
      setError('Please enter a valid email address.');
      setIsSubmitting(false);
      return;
    }

    const result = await signIn('email', {
      email,
      redirect: false,
      callbackUrl: '/account',
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push('/login?sent=true');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send magic link'}
      </button>
      {error ? <p>Unable to sign in right now: {error}</p> : null}
    </form>
  );
}
