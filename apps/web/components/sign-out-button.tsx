'use client';

import { signOut } from 'next-auth/react';
import { Button } from './ui/button';

export function SignOutButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="ghost" className={className} onClick={() => signOut({ callbackUrl: '/' })}>
      Sign out
    </Button>
  );
}
