import { z } from 'zod';

export const accountFormSchema = z
  .object({
    type: z.enum(['CashWallet', 'BankAccount', 'DigitalWallet', 'CreditCard', 'DebitCard', 'SavingsAccount']),
    name: z.string().trim().min(1),
    bankId: z.string().nullable().optional(),
    cardType: z.enum(['Visa', 'Mastercard', 'Meeza']).nullable().optional(),
    last4Digits: z
      .string()
      .trim()
      .regex(/^\d{4}$/, 'Must be exactly 4 digits')
      .nullable()
      .optional(),
    dueDateDay: z.number().int().min(1).max(31).nullable().optional(),
    statementDateDay: z.number().int().min(1).max(31).nullable().optional(),
    creditLimit: z.number().positive().nullable().optional(),
  })
  .refine((data) => data.type !== 'CreditCard' || data.dueDateDay != null, {
    message: 'Credit card accounts require a due date',
    path: ['dueDateDay'],
  })
  .refine((data) => !['CreditCard', 'DebitCard'].includes(data.type) || !!data.bankId, {
    message: 'Bank is required for card accounts',
    path: ['bankId'],
  })
  .refine((data) => !['CreditCard', 'DebitCard'].includes(data.type) || !!data.last4Digits, {
    message: 'Last 4 digits are required for card accounts',
    path: ['last4Digits'],
  })
  .refine((data) => data.type !== 'BankAccount' || !!data.bankId, {
    message: 'Bank is required for bank accounts',
    path: ['bankId'],
  });

export type AccountFormValues = z.infer<typeof accountFormSchema>;
