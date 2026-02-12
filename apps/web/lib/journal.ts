import { prisma } from './prisma';
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntryById,
  listJournalEntries,
  updateJournalEntry,
} from './application/journal-service';

export { createJournalEntry, deleteJournalEntry, getJournalEntryById, listJournalEntries, updateJournalEntry };

export async function getUserIdByEmail(email: string) {
  const db = prisma as unknown as { user: { findUnique(args: { where: { email: string }; select: { id: true } }): Promise<{ id: string } | null> } };
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}
