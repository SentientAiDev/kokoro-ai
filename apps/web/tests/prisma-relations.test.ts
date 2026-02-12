import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Prisma schema and migration relations', () => {
  const schema = readFileSync(resolve(process.cwd(), 'prisma/schema.prisma'), 'utf-8');
  const initMigration = readFileSync(
    resolve(process.cwd(), 'prisma/migrations/20261012000000_init/migration.sql'),
    'utf-8',
  );

  it('keeps one-to-one relation between JournalEntry and EpisodicSummary', () => {
    expect(schema).toContain('journalEntryId  String       @unique');
    expect(schema).toContain(
      '@relation(fields: [journalEntryId], references: [id], onDelete: Cascade)',
    );
    expect(initMigration).toContain('CREATE UNIQUE INDEX "EpisodicSummary_journalEntryId_key"');
  });

  it('keeps consent memory uniqueness and user cascade foreign key', () => {
    expect(schema).toContain('@@unique([userId, key])');
    expect(initMigration).toContain(
      'ALTER TABLE "PreferenceMemory" ADD CONSTRAINT "PreferenceMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE',
    );
  });
});
