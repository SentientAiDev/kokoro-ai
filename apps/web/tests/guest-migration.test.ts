import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: { findUnique: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock('../lib/prisma', () => ({ prisma: prismaMock }));

describe('migrateGuestDataToUser', () => {
  beforeEach(() => {
    vi.resetModules();
    prismaMock.user.findUnique.mockReset();
    prismaMock.$transaction.mockReset();
  });

  it('is idempotent when guest does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const { migrateGuestDataToUser } = await import('../lib/guest-migration');
    await expect(migrateGuestDataToUser('missing-guest', 'user-1')).resolves.toEqual({ migrated: false });
  });

  it('runs migration transaction when guest exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'guest-user', isGuest: true });
    prismaMock.$transaction.mockImplementation(async (cb: (tx: Record<string, unknown>) => Promise<void>) => {
      const tx = {
        journalEntry: { updateMany: vi.fn() },
        episodicSummary: { updateMany: vi.fn() },
        preferenceMemory: { findMany: vi.fn().mockResolvedValue([]), delete: vi.fn(), update: vi.fn() },
        notificationSetting: { findUnique: vi.fn().mockResolvedValue(null), deleteMany: vi.fn(), updateMany: vi.fn() },
        checkInSuggestion: { updateMany: vi.fn() },
        auditLog: { updateMany: vi.fn() },
        abuseReport: { updateMany: vi.fn() },
        feedbackMessage: { updateMany: vi.fn() },
        user: { delete: vi.fn() },
      };
      await cb(tx);
    });

    const { migrateGuestDataToUser } = await import('../lib/guest-migration');
    await expect(migrateGuestDataToUser('guest-id', 'user-1')).resolves.toEqual({ migrated: true });
  });
});
