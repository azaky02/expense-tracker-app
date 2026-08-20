export interface TransactionInput {
  amount: number;
  type: 'Expense' | 'Income';
  categoryId: string;
  paymentMethodType: 'Cash' | 'Card';
  cardId?: string | null;
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
  paymentMethodType: 'Cash' | 'Card';
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  cardId: string | null;
  cardNickname: string | null;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
}
