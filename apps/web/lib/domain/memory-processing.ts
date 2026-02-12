import { generateEpisodicSummary } from '../episodic-summary';
import { redactText } from '../infrastructure/redaction';

export function processJournalIntoMemory(content: string) {
  const generated = generateEpisodicSummary(content);

  return {
    summary: redactText(generated.summary),
    topics: generated.topics,
    openLoops: generated.openLoops.map((loop) => redactText(loop)),
  };
}
