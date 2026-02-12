import { z } from 'zod';

export const writePreferenceMemorySchema = z.object({
  key: z.string().trim().min(1).max(128),
  value: z.unknown(),
  source: z.string().trim().max(256).optional(),
  consentGranted: z.literal(true),
  consentGivenAt: z.coerce.date().optional(),
});

export type WritePreferenceMemoryInput = z.infer<typeof writePreferenceMemorySchema>;
