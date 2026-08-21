export type IncomeType = 'Salary' | 'CashReceipt' | 'IncomingTransfer' | 'Other';

/** Extra fields for non-Custody income sub-types. All optional — only the ones relevant to the
 * chosen incomeType are actually shown/required in the form (enforced in validators.ts). */
export interface IncomeDetailsInput {
  personId?: string | null;
  employer?: string | null;
  payPeriod?: string | null;
  employerDueDate?: string | null;
  reason?: string | null;
  senderName?: string | null;
  referenceNote?: string | null;
  source?: string | null;
  description?: string | null;
}

export interface TransactionInput {
  amount: number;
  type: 'Expense' | 'Income';
  categoryId: string;
  accountId: string;
  incomeType?: IncomeType | null;
  incomeDetails?: IncomeDetailsInput | null;
  date: string; // 'YYYY-MM-DD'
  note?: string | null;
  attachmentUri?: string | null;
  beneficiaryName?: string | null;
}

export interface TransactionListItem {
  id: string;
  amount: number;
  type: 'Expense' | 'Income';
  date: string;
  note: string | null;
  attachmentUri: string | null;
  beneficiaryName: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  accountId: string;
  accountName: string | null;
  incomeType: IncomeType | null;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
}
