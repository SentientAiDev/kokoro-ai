import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  settingFindUniqueMock,
  settingUpsertMock,
  countMock,
  summaryFindManyMock,
  journalFindFirstMock,
  suggestionCreateMock,
  auditCreateMock,
} = vi.hoisted(() => ({
  settingFindUniqueMock: vi.fn(),
  settingUpsertMock: vi.fn(),
  countMock: vi.fn(),
  summaryFindManyMock: vi.fn(),
  journalFindFirstMock: vi.fn(),
  suggestionCreateMock: vi.fn(),
  auditCreateMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    notificationSetting: {
      findUnique: settingFindUniqueMock,
      upsert: settingUpsertMock,
    },
    checkInSuggestion: {
      count: countMock,
      create: suggestionCreateMock,
    },
    episodicSummary: {
      findMany: summaryFindManyMock,
    },
    journalEntry: {
      findFirst: journalFindFirstMock,
    },
    auditLog: {
      create: auditCreateMock,
    },
  },
}));

import { generateCheckInSuggestionForUser } from '../lib/check-ins';

describe('generateCheckInSuggestionForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settingFindUniqueMock.mockResolvedValue({
      proactiveCheckIns: true,
      checkInWindowStart: '09:00',
      checkInWindowEnd: '20:00',
      checkInMaxPerDay: 1,
      checkInInactivityDays: 3,
    });
    countMock.mockResolvedValue(0);
    auditCreateMock.mockResolvedValue({ id: 'audit-1' });
    suggestionCreateMock.mockResolvedValue({
      id: 'suggestion-1',
      message: 'Quick check-in',
      status: 'pending',
      why: 'Because',
      reasonDetails: { openLoops: [], inactivityDays: 4, sourceSummaryIds: [] },
      createdAt: new Date('2026-10-15T00:00:00.000Z'),
      snoozedUntil: null,
    });
  });

  it('creates a suggestion from open loops in recent summaries', async () => {
    summaryFindManyMock.mockResolvedValue([
      {
        id: 'summary-1',
        summary: 'Need to follow up with design.',
        openLoops: ['Follow up with design team'],
        createdAt: new Date('2026-10-14T00:00:00.000Z'),
      },
    ]);
    journalFindFirstMock.mockResolvedValue({ createdAt: new Date('2026-10-14T00:00:00.000Z') });

    const result = await generateCheckInSuggestionForUser('user-1', new Date('2026-10-15T00:00:00.000Z'));

    expect(result).not.toBeNull();
    expect(suggestionCreateMock).toHaveBeenCalledTimes(1);
    expect(auditCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'checkin.created',
        }),
      }),
    );
  });

  it('creates a suggestion on inactivity without open loops', async () => {
    summaryFindManyMock.mockResolvedValue([]);
    journalFindFirstMock.mockResolvedValue({ createdAt: new Date('2026-10-10T00:00:00.000Z') });

    const result = await generateCheckInSuggestionForUser('user-1', new Date('2026-10-15T00:00:00.000Z'));

    expect(result).not.toBeNull();
    expect(suggestionCreateMock).toHaveBeenCalledTimes(1);
  });

  it('does not create suggestion when daily cap is reached', async () => {
    countMock.mockResolvedValue(1);
    summaryFindManyMock.mockResolvedValue([
      {
        id: 'summary-1',
        summary: 'Need to follow up with design.',
        openLoops: ['Follow up with design team'],
        createdAt: new Date('2026-10-14T00:00:00.000Z'),
      },
    ]);
    journalFindFirstMock.mockResolvedValue({ createdAt: new Date('2026-10-10T00:00:00.000Z') });

    const result = await generateCheckInSuggestionForUser('user-1', new Date('2026-10-15T00:00:00.000Z'));

    expect(result).toBeNull();
    expect(suggestionCreateMock).not.toHaveBeenCalled();
  });
});
