import { memoryService } from '../application/memory-service';
import { generateCheckInSuggestionForUser } from '../check-ins';

export async function onJournalEntryCreated(input: {
  userId: string;
  journalEntryId: string;
  content: string;
}) {
  await memoryService.writeEpisodicSummary(input);
  await generateCheckInSuggestionForUser(input.userId);
}
