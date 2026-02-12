'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { reportError } from '../lib/infrastructure/error-reporting';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError({
      event: 'ui.unhandled_error',
      error,
      data: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6">
      <Card className="space-y-3">
        <h1>Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected issue. Your data is safe, and you can retry now.
        </p>
        <Button type="button" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
