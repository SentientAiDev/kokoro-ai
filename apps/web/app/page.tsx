import React from 'react';
import { appName } from '@kokoro/shared';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', margin: '3rem auto', maxWidth: 720 }}>
      <h1>{appName}</h1>
      <p>Monorepo bootstrap complete. Next up: database and Prisma setup.</p>
    </main>
  );
}
