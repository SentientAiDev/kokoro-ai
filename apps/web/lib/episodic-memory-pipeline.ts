import { memoryService } from './application/memory-service';

export async function runEpisodicMemoryPipeline(input: {
  userId: string;
  journalEntryId: string;
  content: string;
}) {
  return memoryService.writeEpisodicSummary(input);
}
