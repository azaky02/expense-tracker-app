import { z } from 'zod';

export const custodyFormSchema = z.object({
  personName: z.string().trim().min(1, 'Person name is required'),
  reason: z.string().nullable().optional(),
  originalAmount: z.number().positive('Amount must be greater than 0'),
  receivedDate: z.string().min(1),
});

export type CustodyFormValues = z.infer<typeof custodyFormSchema>;

export function settlementSchema(remaining: number) {
  return z.object({
    amount: z.number().positive().max(remaining, 'Amount exceeds remaining custody balance'),
    date: z.string().min(1),
    note: z.string().nullable().optional(),
  });
}
