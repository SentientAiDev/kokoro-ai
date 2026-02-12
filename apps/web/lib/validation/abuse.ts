import { z } from 'zod';

export const abuseReportSchema = z.object({
  category: z.enum(['bug', 'security', 'abuse', 'other']),
  message: z.string().trim().min(10).max(2000),
  email: z.string().email().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AbuseReportInput = z.infer<typeof abuseReportSchema>;
