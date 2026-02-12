'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/toast';

export function DeleteAllMemoriesButton() {
  const { pushToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm('Delete all episodic and preference memories? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    const response = await fetch('/api/memory', { method: 'DELETE' });

    if (!response.ok) {
      pushToast('Unable to delete all memories right now.', 'error');
      setIsDeleting(false);
      return;
    }

    pushToast('All memories deleted.');
    setIsDeleting(false);
  }

  return (
    <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete all memories'}
    </Button>
  );
}
