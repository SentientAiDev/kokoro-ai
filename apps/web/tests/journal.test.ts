import { beforeEach, describe, expect, it, vi } from 'vitest';

const { prismaMock, runEpisodicMemoryPipelineMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  runEpisodicMemoryPipelineMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: prismaMock,
}));

vi.mock('../lib/episodic-memory-pipeline', () => ({
  runEpisodicMemoryPipeline: runEpisodicMemoryPipelineMock,
}));

import { createJournalEntry } from '../lib/journal';

describe('createJournalEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns created entry even when episodic pipeline fails', async () => {
    const createdEntry = {
      id: 'entry-1',
      content: 'Today I planned my week.',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    prismaMock.journalEntry.create.mockResolvedValueOnce(createdEntry);
    runEpisodicMemoryPipelineMock.mockRejectedValueOnce(new Error('pipeline failed'));

    await expect(createJournalEntry('user-1', createdEntry.content)).resolves.toEqual(createdEntry);

    expect(prismaMock.journalEntry.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        content: createdEntry.content,
      },
    });
    expect(runEpisodicMemoryPipelineMock).toHaveBeenCalledWith({
      userId: 'user-1',
      journalEntryId: createdEntry.id,
      content: createdEntry.content,
    });
  });
});
