import { runEpisodicMemoryPipeline } from './episodic-memory-pipeline';
import { prisma } from './prisma';

export type JournalEntryListItem = {
  id: string;
  content: string;
  createdAt: Date;
};

type JournalEntryDetail = JournalEntryListItem & {
  updatedAt: Date;
};

type JournalDb = {
  user: {
    findUnique(args: {
      where: { email: string };
      select: { id: true };
    }): Promise<{ id: string } | null>;
  };
  journalEntry: {
    create(args: { data: { userId: string; content: string } }): Promise<JournalEntryListItem>;
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: { id: true; content: true; createdAt: true };
    }): Promise<JournalEntryListItem[]>;
    findFirst(args: {
      where: { id: string; userId: string };
      select: { id: true; content: true; createdAt: true; updatedAt: true };
    }): Promise<JournalEntryDetail | null>;
  };
};

const db = prisma as unknown as JournalDb;

export async function getUserIdByEmail(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function createJournalEntry(userId: string, content: string) {
  const journalEntry = await db.journalEntry.create({
    data: {
      userId,
      content,
    },
  });

  await runEpisodicMemoryPipeline({
    userId,
    journalEntryId: journalEntry.id,
    content: journalEntry.content,
  });

  return journalEntry;
}

export async function listJournalEntries(userId: string): Promise<JournalEntryListItem[]> {
  return db.journalEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  });
}

export async function getJournalEntryById(id: string, userId: string) {
  return db.journalEntry.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
