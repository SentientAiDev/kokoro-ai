import { memoryService } from './application/memory-service';

export type RecallReason = 'query match' | 'topic overlap' | 'open loop';

export type RecallItem = {
  id: string;
  memoryType: 'episodic' | 'preference';
  sourceDate: Date;
  content: string;
  reason: RecallReason;
  journalEntryId: string | null;
  whyShown: string;
};

export async function searchRecall(userId: string, rawQuery: string) {
  return memoryService.recall(userId, rawQuery);
}

export async function deleteMemoryItem(input: {
  userId: string;
  memoryType: 'episodic' | 'preference';
  id: string;
}) {
  return memoryService.deleteMemory(input);
}
