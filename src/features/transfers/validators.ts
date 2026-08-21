import { z } from 'zod';

export const transferFormSchema = z
  .object({
    fromAccountId: z.string().min(1, 'Pick a source account'),
    toAccountId: z.string().min(1, 'Pick a destination account'),
    amount: z.number().positive('Amount must be greater than 0'),
    date: z.string().min(1),
    note: z.string().nullable().optional(),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: 'Source and destination accounts must differ',
    path: ['toAccountId'],
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;
