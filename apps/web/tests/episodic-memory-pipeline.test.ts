import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUniqueMock, createMock, updateMock, auditCreateMock, generateSummaryMock } = vi.hoisted(
  () => ({
    findUniqueMock: vi.fn(),
    createMock: vi.fn(),
    updateMock: vi.fn(),
    auditCreateMock: vi.fn(),
    generateSummaryMock: vi.fn(),
  }),
);

vi.mock('../lib/prisma', () => ({
  prisma: {
    episodicSummary: {
      findUnique: findUniqueMock,
      create: createMock,
      update: updateMock,
    },
    auditLog: {
      create: auditCreateMock,
    },
  },
}));

vi.mock('../lib/episodic-summary', () => ({
  generateEpisodicSummary: generateSummaryMock,
}));

import { runEpisodicMemoryPipeline } from '../lib/episodic-memory-pipeline';

describe('runEpisodicMemoryPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    generateSummaryMock.mockReturnValue({
      summary: 'A summary',
      topics: ['work'],
      openLoops: ['Need to follow up'],
    });
  });

  it('creates a summary and audit event when one does not exist', async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    createMock.mockResolvedValueOnce({ id: 'summary-1' });

    await runEpisodicMemoryPipeline({
      userId: 'user-1',
      journalEntryId: 'entry-1',
      content: 'work note',
    });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it('is idempotent when generated content has not changed', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'summary-1',
      summary: 'A summary',
      topics: ['work'],
      openLoops: ['Need to follow up'],
    });

    await runEpisodicMemoryPipeline({
      userId: 'user-1',
      journalEntryId: 'entry-1',
      content: 'work note',
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
    expect(auditCreateMock).not.toHaveBeenCalled();
  });

  it('updates and audits when generated content changes', async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: 'summary-1',
      summary: 'old',
      topics: ['health'],
      openLoops: ['old loop'],
    });
    updateMock.mockResolvedValueOnce({ id: 'summary-1' });

    await runEpisodicMemoryPipeline({
      userId: 'user-1',
      journalEntryId: 'entry-1',
      content: 'work note',
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(createMock).not.toHaveBeenCalled();
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });
});
