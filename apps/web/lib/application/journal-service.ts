import { prisma } from '../prisma';
import { publishEvent, subscribeEvent } from './events';
import { MemoryService } from './memory-service';

type JournalEntryListItem = {
  id: string;
  content: string;
  createdAt: Date;
};

type JournalEntryDetail = JournalEntryListItem & {
  updatedAt: Date;
};

type JournalServiceDb = {
  user: {
    findUnique(args: { where: { email: string }; select: { id: true } }): Promise<{ id: string } | null>;
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
    update(args: {
      where: { id: string };
      data: { content: string };
      select: { id: true; content: true; createdAt: true; updatedAt: true };
    }): Promise<JournalEntryDetail>;
    deleteMany(args: { where: { id: string; userId: string } }): Promise<{ count: number }>;
  };
};

const db = prisma as unknown as JournalServiceDb;

let journalHandlersRegistered = false;

function registerJournalEventHandlers() {
  if (journalHandlersRegistered) {
    return;
  }

  subscribeEvent('journal-entry.created', async (event) => {
    await MemoryService.writeEpisodicSummaryFromJournal({
      userId: event.userId,
      journalEntryId: event.journalEntryId,
      content: event.content,
    });
  });

  journalHandlersRegistered = true;
}

registerJournalEventHandlers();

export const JournalService = {
  async getUserIdByEmail(email: string) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });
    return user?.id ?? null;
  },

  async createEntry(userId: string, content: string) {
    const journalEntry = await db.journalEntry.create({ data: { userId, content } });

    await publishEvent({
      type: 'journal-entry.created',
      userId,
      journalEntryId: journalEntry.id,
      content: journalEntry.content,
    });

    return journalEntry;
  },

  async listEntries(userId: string): Promise<JournalEntryListItem[]> {
    return db.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, content: true, createdAt: true },
    });
  },

  async getEntryById(id: string, userId: string) {
    return db.journalEntry.findFirst({
      where: { id, userId },
      select: { id: true, content: true, createdAt: true, updatedAt: true },
    });
  },

  async updateEntry(id: string, userId: string, content: string) {
    const existing = await db.journalEntry.findFirst({
      where: { id, userId },
      select: { id: true, content: true, createdAt: true, updatedAt: true },
    });

    if (!existing) {
      return null;
    }

    return db.journalEntry.update({
      where: { id },
      data: { content },
      select: { id: true, content: true, createdAt: true, updatedAt: true },
    });
  },

  async deleteEntry(id: string, userId: string) {
    const result = await db.journalEntry.deleteMany({ where: { id, userId } });
    return result.count > 0;
  },
};
