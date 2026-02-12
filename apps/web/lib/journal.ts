import { JournalService } from './application/journal-service';

export type JournalEntryListItem = {
  id: string;
  content: string;
  createdAt: Date;
};

export async function getUserIdByEmail(email: string) {
  return JournalService.getUserIdByEmail(email);
}

export async function createJournalEntry(userId: string, content: string) {
  return JournalService.createEntry(userId, content);
}

export async function listJournalEntries(userId: string): Promise<JournalEntryListItem[]> {
  return JournalService.listEntries(userId);
}

export async function getJournalEntryById(id: string, userId: string) {
  return JournalService.getEntryById(id, userId);
}

export async function updateJournalEntry(id: string, userId: string, content: string) {
  return JournalService.updateEntry(id, userId, content);
}

export async function deleteJournalEntry(id: string, userId: string) {
  return JournalService.deleteEntry(id, userId);
}
