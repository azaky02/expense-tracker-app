import { z } from 'zod';

export const recurringFormSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(['Expense', 'Income']),
  categoryId: z.string().min(1, 'Pick a category'),
  accountId: z.string().min(1, 'Pick an account'),
  incomeType: z.enum(['Salary', 'CashReceipt', 'IncomingTransfer', 'Other']).nullable().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  note: z.string().nullable().optional(),
  beneficiaryName: z.string().nullable().optional(),
  frequency: z.enum(['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom']),
  intervalDays: z.number().int().positive().nullable().optional(),
  startDate: z.string().min(1),
});

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
