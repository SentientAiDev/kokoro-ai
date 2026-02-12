import { beforeEach, describe, expect, it, vi } from 'vitest';

type JournalRecord = { id: string; userId: string; content: string; createdAt: Date; updatedAt: Date };
type SummaryRecord = {
  id: string;
  userId: string;
  journalEntryId: string;
  summary: string;
  topics: string[];
  openLoops: string[];
  whyShown: string;
  createdAt: Date;
};
type AuditRecord = { action: string; entityType: string; entityId: string; metadata: Record<string, unknown>; userId: string };
type CheckInRecord = {
  id: string;
  userId: string;
  message: string;
  why: string;
  reasonDetails: { openLoops: Array<{ summaryId: string; summary: string; loop: string }>; inactivityDays: number | null; sourceSummaryIds: string[] };
  status: 'pending';
  createdAt: Date;
  snoozedUntil: null;
};

const state = vi.hoisted(() => {
  const storage = {
    journalEntries: [] as JournalRecord[],
    summaries: [] as SummaryRecord[],
    audits: [] as AuditRecord[],
    checkIns: [] as CheckInRecord[],
    settings: {
      proactiveCheckIns: true,
      checkInWindowStart: '00:00',
      checkInWindowEnd: '23:59',
      checkInMaxPerDay: 1,
      checkInInactivityDays: 1,
    },
  };

  const now = new Date('2026-10-15T10:00:00.000Z');

  return { storage, now };
});

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user-1' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    journalEntry: {
      create: vi.fn(async ({ data }: { data: { userId: string; content: string } }) => {
        const entry: JournalRecord = {
          id: `entry-${state.storage.journalEntries.length + 1}`,
          userId: data.userId,
          content: data.content,
          createdAt: state.now,
          updatedAt: state.now,
        };
        state.storage.journalEntries.push(entry);
        return entry;
      }),
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        state.storage.journalEntries.filter((entry) => entry.userId === where.userId),
      ),
      findFirst: vi.fn(async ({ where }: { where: { userId: string } }) => {
        const entries = state.storage.journalEntries.filter((entry) => entry.userId === where.userId);
        return entries.length > 0 ? { createdAt: entries[entries.length - 1].createdAt } : null;
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn(),
    },
    episodicSummary: {
      findUnique: vi.fn(async ({ where }: { where: { journalEntryId: string } }) =>
        state.storage.summaries.find((item) => item.journalEntryId === where.journalEntryId) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: Omit<SummaryRecord, 'id' | 'createdAt'> }) => {
        const summary: SummaryRecord = {
          id: `summary-${state.storage.summaries.length + 1}`,
          createdAt: state.now,
          ...data,
        };
        state.storage.summaries.push(summary);
        return { id: summary.id };
      }),
      update: vi.fn(async ({ where, data }: { where: { journalEntryId: string }; data: Partial<SummaryRecord> }) => {
        const existing = state.storage.summaries.find((item) => item.journalEntryId === where.journalEntryId);
        if (!existing) {
          throw new Error('missing summary');
        }
        Object.assign(existing, data);
        return { id: existing.id };
      }),
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) =>
        state.storage.summaries.filter((item) => item.userId === where.userId),
      ),
      findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string } }) =>
        state.storage.summaries.find((item) => item.id === where.id && item.userId === where.userId)
          ? { id: where.id }
          : null,
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        state.storage.summaries = state.storage.summaries.filter((item) => item.id !== where.id);
        return { id: where.id };
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    preferenceMemory: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      upsert: vi.fn(),
    },
    notificationSetting: {
      findUnique: vi.fn(async () => state.storage.settings),
      upsert: vi.fn(async () => state.storage.settings),
    },
    checkInSuggestion: {
      count: vi.fn(async ({ where }: { where: { userId: string } }) =>
        state.storage.checkIns.filter((item) => item.userId === where.userId).length,
      ),
      create: vi.fn(async ({ data }: { data: Omit<CheckInRecord, 'id' | 'status' | 'createdAt' | 'snoozedUntil'> }) => {
        const checkIn: CheckInRecord = {
          id: `checkin-${state.storage.checkIns.length + 1}`,
          status: 'pending',
          createdAt: state.now,
          snoozedUntil: null,
          ...data,
        };
        state.storage.checkIns.push(checkIn);
        return checkIn;
      }),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(async ({ data }: { data: AuditRecord }) => {
        state.storage.audits.push(data);
        return { id: `audit-${state.storage.audits.length}` };
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

import { createJournalEntry } from '../lib/journal';
import { searchRecall, deleteMemoryItem } from '../lib/recall';
import { generateCheckInSuggestionForUser } from '../lib/check-ins';

describe('daily loop integration', () => {
  beforeEach(() => {
    state.storage.journalEntries = [];
    state.storage.summaries = [];
    state.storage.audits = [];
    state.storage.checkIns = [];
  });

  it('supports create entry -> summary -> recall, delete -> audit, and check-in cap behavior', async () => {
    const entry = await createJournalEntry(
      'user-1',
      'I need to follow up with design tomorrow and keep preparing for demo day.',
    );

    expect(entry.id).toBe('entry-1');
    expect(state.storage.summaries).toHaveLength(1);

    const recallItems = await searchRecall('user-1', 'follow up');
    expect(recallItems.length).toBeGreaterThan(0);

    const deleted = await deleteMemoryItem({ userId: 'user-1', memoryType: 'episodic', id: 'summary-1' });
    expect(deleted).toBe(true);
    expect(state.storage.audits.some((audit) => audit.action === 'memory.deleted')).toBe(true);

    state.storage.summaries.push({
      id: 'summary-2',
      userId: 'user-1',
      journalEntryId: 'entry-1',
      summary: 'Follow up with design',
      topics: ['follow up'],
      openLoops: ['Follow up with design team'],
      whyShown: 'Generated from journal',
      createdAt: state.now,
    });

    const first = await generateCheckInSuggestionForUser('user-1', state.now);
    const second = await generateCheckInSuggestionForUser('user-1', state.now);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });
});
