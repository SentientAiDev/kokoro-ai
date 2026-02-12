import { prisma } from '../prisma';
import { onJournalEntryCreated } from '../events/journal-events';

type JournalServiceDb = {
  journalEntry: {
    create(args: { data: { userId: string; content: string } }): Promise<{ id: string; content: string; createdAt: Date }>;
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: { id: true; content: true; createdAt: true };
    }): Promise<Array<{ id: string; content: string; createdAt: Date }>>;
    findFirst(args: {
      where: { id: string; userId: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
    findFirst(args: {
      where: { id: string; userId: string };
      select: { id: true; content: true; createdAt: true; updatedAt: true };
    }): Promise<{ id: string; content: string; createdAt: Date; updatedAt: Date } | null>;
    update(args: { where: { id: string }; data: { content: string } }): Promise<{ id: string; content: string; createdAt: Date }>;
    delete(args: { where: { id: string } }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as JournalServiceDb;

export async function createJournalEntry(userId: string, content: string) {
  const journalEntry = await db.journalEntry.create({ data: { userId, content } });
  await onJournalEntryCreated({ userId, journalEntryId: journalEntry.id, content: journalEntry.content });
  return journalEntry;
}

export async function listJournalEntries(userId: string): Promise<Array<{ id: string; content: string; createdAt: Date }>> {
  return db.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, content: true, createdAt: true },
  });
}

export async function getJournalEntryById(id: string, userId: string): Promise<{ id: string; content: string; createdAt: Date; updatedAt: Date } | null> {
  return db.journalEntry.findFirst({ where: { id, userId }, select: { id: true, content: true, createdAt: true, updatedAt: true } });
}

export async function updateJournalEntry(input: { id: string; userId: string; content: string }) {
  const found = await db.journalEntry.findFirst({ where: { id: input.id, userId: input.userId }, select: { id: true } });
  if (!found) {
    return null;
  }
  const updated = await db.journalEntry.update({ where: { id: input.id }, data: { content: input.content } });
  await onJournalEntryCreated({ userId: input.userId, journalEntryId: updated.id, content: updated.content });
  return updated;
}

export async function deleteJournalEntry(input: { id: string; userId: string }) {
  const found = await db.journalEntry.findFirst({ where: { id: input.id, userId: input.userId }, select: { id: true } });
  if (!found) return false;
  await db.journalEntry.delete({ where: { id: input.id } });
  return true;
}
