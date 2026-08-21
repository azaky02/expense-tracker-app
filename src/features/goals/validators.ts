import { z } from 'zod';

export const goalFormSchema = z.object({
  name: z.string().trim().min(1),
  targetAmount: z.number().positive('Target must be greater than 0'),
  targetDate: z.string().nullable().optional(),
  linkedAccountId: z.string().min(1, 'Pick a savings account'),
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;
