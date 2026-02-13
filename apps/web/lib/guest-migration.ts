import { prisma } from './prisma';

type MigrationTx = {
  journalEntry: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  episodicSummary: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  preferenceMemory: {
    findMany(args: { where: { userId: string }; select: Record<string, true> }): Promise<Array<{ id?: string; key: string }>>;
    delete(args: { where: { id: string } }): Promise<unknown>;
    update(args: { where: { id: string }; data: { userId: string } }): Promise<unknown>;
  };
  notificationSetting: {
    findUnique(args: { where: { userId: string }; select: { id: true } }): Promise<{ id: string } | null>;
    deleteMany(args: { where: { userId: string } }): Promise<unknown>;
    updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown>;
  };
  checkInSuggestion: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  auditLog: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  abuseReport: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  feedbackMessage: { updateMany(args: { where: { userId: string }; data: { userId: string } }): Promise<unknown> };
  user: { delete(args: { where: { id: string } }): Promise<unknown> };
};

type MigrationDb = {
  user: { findUnique(args: { where: { guestId: string }; select: { id: true; isGuest: true } }): Promise<{ id: string; isGuest: boolean } | null> };
  $transaction<T>(fn: (tx: MigrationTx) => Promise<T>): Promise<T>;
};

const db = prisma as unknown as MigrationDb;

export async function migrateGuestDataToUser(guestId: string, userId: string) {
  const guestUser = await db.user.findUnique({ where: { guestId }, select: { id: true, isGuest: true } });

  if (!guestUser?.isGuest || guestUser.id === userId) {
    return { migrated: false };
  }

  await db.$transaction(async (tx) => {
    await tx.journalEntry.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    await tx.episodicSummary.updateMany({ where: { userId: guestUser.id }, data: { userId } });

    const userPreferenceKeys = await tx.preferenceMemory.findMany({ where: { userId }, select: { key: true } });
    const existingKeys = new Set(userPreferenceKeys.map((item) => item.key));
    const guestPreferences = await tx.preferenceMemory.findMany({ where: { userId: guestUser.id }, select: { id: true, key: true } });

    for (const guestPreference of guestPreferences) {
      if (existingKeys.has(guestPreference.key)) {
        if (guestPreference.id) {
          await tx.preferenceMemory.delete({ where: { id: guestPreference.id } });
        }
      } else {
        if (guestPreference.id) {
          await tx.preferenceMemory.update({ where: { id: guestPreference.id }, data: { userId } });
        }
      }
    }

    const userNotification = await tx.notificationSetting.findUnique({ where: { userId }, select: { id: true } });
    if (userNotification) {
      await tx.notificationSetting.deleteMany({ where: { userId: guestUser.id } });
    } else {
      await tx.notificationSetting.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    }

    await tx.checkInSuggestion.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    await tx.auditLog.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    await tx.abuseReport.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    await tx.feedbackMessage.updateMany({ where: { userId: guestUser.id }, data: { userId } });
    await tx.user.delete({ where: { id: guestUser.id } });
  });

  return { migrated: true };
}
