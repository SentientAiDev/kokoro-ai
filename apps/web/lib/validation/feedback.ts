import { z } from 'zod';

export const feedbackSchema = z.object({
  email: z.string().email().optional(),
  message: z.string().min(10).max(2_000),
  page: z.string().max(200).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
