import { z } from 'zod';

export const createJournalEntrySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Content is required')
    .max(4000, 'Content must be 4000 characters or fewer'),
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
