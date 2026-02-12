import React from 'react';
import Link from 'next/link';
import { appName } from '@kokoro/shared';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 720 }}>
      <h1>{appName}</h1>
      <p>Auth is enabled with email magic links via NextAuth.</p>
      <p>
        <Link href="/login">Sign in with magic link</Link>
      </p>
      <p>
        <Link href="/account">Open account</Link>
      </p>
      <p>
        <Link href="/journal">Open journal</Link>
      </p>
    </main>
  );
}
