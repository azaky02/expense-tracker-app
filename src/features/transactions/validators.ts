import { z } from 'zod';

/** The income-type picker shown in the form includes 'Custody', even though a Custody
 * transaction never becomes a `transactions` row — see TransactionForm's submit handler, which
 * routes Custody submissions to `createCustodyRecord` instead of `createTransaction`. */
export const incomeTypeUiSchema = z.enum(['Salary', 'CashReceipt', 'Custody', 'IncomingTransfer', 'Other']);

export const transactionFormSchema = z
  .object({
    amount: z.number().positive('Amount must be greater than 0'),
    type: z.enum(['Expense', 'Income']),
    categoryId: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    incomeTypeUi: incomeTypeUiSchema.nullable().optional(),
    date: z.string().min(1),
    note: z.string().nullable().optional(),
    attachmentUri: z.string().nullable().optional(),
    beneficiaryName: z.string().nullable().optional(),
    // Income sub-type fields (only the relevant subset is required per incomeTypeUi, see refine below)
    personName: z.string().nullable().optional(),
    reason: z.string().nullable().optional(),
    employer: z.string().nullable().optional(),
    payPeriod: z.string().nullable().optional(),
    employerDueDate: z.string().nullable().optional(),
    senderName: z.string().nullable().optional(),
    referenceNote: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => data.type !== 'Expense' || !!data.categoryId, {
    message: 'Pick a category',
    path: ['categoryId'],
  })
  .refine((data) => data.type !== 'Expense' || !!data.accountId, {
    message: 'Pick an account',
    path: ['accountId'],
  })
  .refine((data) => data.type !== 'Income' || data.incomeTypeUi === 'Custody' || !!data.categoryId, {
    message: 'Pick a category',
    path: ['categoryId'],
  })
  .refine((data) => data.type !== 'Income' || !!data.incomeTypeUi, {
    message: 'Pick an income type',
    path: ['incomeTypeUi'],
  })
  .refine((data) => data.type !== 'Income' || data.incomeTypeUi === 'Custody' || !!data.accountId, {
    message: 'Pick an account',
    path: ['accountId'],
  })
  .refine((data) => data.incomeTypeUi !== 'Custody' || !!data.personName?.trim(), {
    message: "Custody requires the owner's name",
    path: ['personName'],
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
