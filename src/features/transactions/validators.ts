import { z } from 'zod';

export const transactionFormSchema = z
  .object({
    amount: z.number().positive('Amount must be greater than 0'),
    type: z.enum(['Expense', 'Income']),
    categoryId: z.string().min(1, 'Pick a category'),
    paymentMethodType: z.enum(['Cash', 'Card']),
    cardId: z.string().nullable().optional(),
    date: z.string().min(1),
    note: z.string().nullable().optional(),
    attachmentUri: z.string().nullable().optional(),
    beneficiaryName: z.string().nullable().optional(),
  })
  .refine((data) => data.paymentMethodType !== 'Card' || !!data.cardId, {
    message: 'Pick a card',
    path: ['cardId'],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
