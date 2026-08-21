import type { IncomeType } from '@/features/transactions/types';

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly' | 'Custom';

export interface RecurringRuleRecord {
  id: string;
  name: string;
  type: 'Expense' | 'Income';
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  incomeType: IncomeType | null;
  amount: number;
  note: string | null;
  beneficiaryName: string | null;
  frequency: RecurringFrequency;
  intervalDays: number | null;
  nextOccurrence: string;
  isActive: boolean;
}

export interface RecurringRuleInput {
  name: string;
  type: 'Expense' | 'Income';
  categoryId: string;
  accountId: string;
  incomeType?: IncomeType | null;
  amount: number;
  note?: string | null;
  beneficiaryName?: string | null;
  frequency: RecurringFrequency;
  intervalDays?: number | null;
  startDate: string;
}
