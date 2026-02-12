import { MemoryService } from './application/memory-service';

export async function runEpisodicMemoryPipeline(input: {
  userId: string;
  journalEntryId: string;
  content: string;
}) {
  return MemoryService.writeEpisodicSummaryFromJournal(input);
}
