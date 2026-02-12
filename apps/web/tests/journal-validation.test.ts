import { describe, expect, it } from 'vitest';
import { createJournalEntrySchema } from '../lib/validation/journal';

describe('createJournalEntrySchema', () => {
  it('accepts valid content', () => {
    const parsed = createJournalEntrySchema.parse({ content: 'Today was productive.' });
    expect(parsed.content).toBe('Today was productive.');
  });

  it('rejects empty content', () => {
    const parsed = createJournalEntrySchema.safeParse({ content: '   ' });
    expect(parsed.success).toBe(false);
  });

  it('rejects overly long content', () => {
    const parsed = createJournalEntrySchema.safeParse({ content: 'a'.repeat(4001) });
    expect(parsed.success).toBe(false);
  });
});
