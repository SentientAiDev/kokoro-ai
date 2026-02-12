import { z } from 'zod';

export const recallQuerySchema = z.object({
  q: z.string().max(500).optional().default(''),
});

export const memoryRouteParamsSchema = z.object({
  memoryType: z.enum(['episodic', 'preference']),
  id: z.string().min(1).max(128),
});

export const checkInActionParamsSchema = z.object({
  id: z.string().min(1).max(128),
});

export const checkInActionSchema = z
  .object({
    action: z.enum(['dismiss', 'snooze', 'done']),
    snoozeDays: z.number().int().min(1).max(30).optional(),
  })
  .refine((value) => (value.action === 'snooze' ? typeof value.snoozeDays === 'number' : true), {
    message: 'snoozeDays is required when action is snooze',
    path: ['snoozeDays'],
  });

export const abuseReportSchema = z.object({
  category: z.enum(['harassment', 'self-harm', 'spam', 'security', 'other']),
  description: z.string().trim().min(10).max(2000),
  contactEmail: z.string().email().optional(),
  contextUrl: z.string().url().optional(),
});

export const journalEntryParamsSchema = z.object({
  id: z.string().min(1).max(128),
});
