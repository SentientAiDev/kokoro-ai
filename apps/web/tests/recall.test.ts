import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  episodicFindManyMock,
  preferenceFindManyMock,
  episodicFindFirstMock,
  episodicDeleteMock,
  preferenceFindFirstMock,
  preferenceUpdateMock,
  auditCreateMock,
} = vi.hoisted(() => ({
  episodicFindManyMock: vi.fn(),
  preferenceFindManyMock: vi.fn(),
  episodicFindFirstMock: vi.fn(),
  episodicDeleteMock: vi.fn(),
  preferenceFindFirstMock: vi.fn(),
  preferenceUpdateMock: vi.fn(),
  auditCreateMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    episodicSummary: {
      findMany: episodicFindManyMock,
      findFirst: episodicFindFirstMock,
      delete: episodicDeleteMock,
    },
    preferenceMemory: {
      findMany: preferenceFindManyMock,
      findFirst: preferenceFindFirstMock,
      update: preferenceUpdateMock,
    },
    auditLog: {
      create: auditCreateMock,
    },
  },
}));

import { deleteMemoryItem, searchRecall } from '../lib/recall';

describe('searchRecall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches episodic memory by topic overlap and preference by query match', async () => {
    episodicFindManyMock.mockResolvedValueOnce([
      {
        id: 'es-1',
        summary: 'Had a good day',
        topics: ['fitness'],
        openLoops: ['book trainer'],
        createdAt: new Date('2026-01-02T08:00:00.000Z'),
        journalEntryId: 'j-1',
        whyShown: 'Generated from journal.',
      },
    ]);
    preferenceFindManyMock.mockResolvedValueOnce([
      {
        id: 'pm-1',
        key: 'music',
        value: { genre: 'lofi' },
        source: 'settings',
        createdAt: new Date('2026-01-03T08:00:00.000Z'),
      },
    ]);

    const results = await searchRecall('user-1', 'fit');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'es-1',
      memoryType: 'episodic',
      reason: 'topic overlap',
      journalEntryId: 'j-1',
    });
  });

  it('labels open loop matches with open loop reason', async () => {
    episodicFindManyMock.mockResolvedValueOnce([
      {
        id: 'es-1',
        summary: 'Need to follow up',
        topics: ['work'],
        openLoops: ['follow up with team'],
        createdAt: new Date('2026-01-02T08:00:00.000Z'),
        journalEntryId: 'j-1',
        whyShown: 'Generated from journal.',
      },
    ]);
    preferenceFindManyMock.mockResolvedValueOnce([]);

    const results = await searchRecall('user-1', 'team');

    expect(results).toHaveLength(1);
    expect(results[0]?.reason).toBe('open loop');
  });
});

describe('deleteMemoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes episodic summaries and writes an audit log', async () => {
    episodicFindFirstMock.mockResolvedValueOnce({ id: 'es-1' });
    episodicDeleteMock.mockResolvedValueOnce({ id: 'es-1' });
    auditCreateMock.mockResolvedValueOnce({ id: 'audit-1' });

    const deleted = await deleteMemoryItem({
      userId: 'user-1',
      memoryType: 'episodic',
      id: 'es-1',
    });

    expect(deleted).toBe(true);
    expect(episodicDeleteMock).toHaveBeenCalledWith({ where: { id: 'es-1' } });
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });

  it('revokes preference memory and writes an audit log', async () => {
    preferenceFindFirstMock.mockResolvedValueOnce({ id: 'pm-1' });
    preferenceUpdateMock.mockResolvedValueOnce({ id: 'pm-1' });
    auditCreateMock.mockResolvedValueOnce({ id: 'audit-1' });

    const deleted = await deleteMemoryItem({
      userId: 'user-1',
      memoryType: 'preference',
      id: 'pm-1',
    });

    expect(deleted).toBe(true);
    expect(preferenceUpdateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });
});
