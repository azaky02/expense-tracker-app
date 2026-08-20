import { z } from 'zod';

export const cardFormSchema = z
  .object({
    bankId: z.string().min(1),
    cardType: z.enum(['Visa', 'Mastercard', 'Meeza']),
    cardCategory: z.enum(['Credit', 'Debit']),
    nickname: z.string().trim().min(1),
    last4Digits: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'Must be exactly 4 digits'),
    dueDateDay: z.number().int().min(1).max(31).nullable().optional(),
    statementDateDay: z.number().int().min(1).max(31).nullable().optional(),
    creditLimit: z.number().positive().nullable().optional(),
  })
  .refine((data) => data.cardCategory !== 'Credit' || data.dueDateDay != null, {
    message: 'Credit cards require a due date',
    path: ['dueDateDay'],
  });

export type CardFormValues = z.infer<typeof cardFormSchema>;
