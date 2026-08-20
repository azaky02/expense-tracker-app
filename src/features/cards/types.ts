export interface CardRecord {
  id: string;
  bankId: string;
  bankName: string;
  cardType: 'Visa' | 'Mastercard' | 'Meeza';
  cardCategory: 'Credit' | 'Debit';
  nickname: string;
  last4Digits: string;
  dueDateDay: number | null;
  statementDateDay: number | null;
  creditLimit: number | null;
  color: string;
  isActive: boolean;
}

export interface CardInput {
  bankId: string;
  cardType: 'Visa' | 'Mastercard' | 'Meeza';
  cardCategory: 'Credit' | 'Debit';
  nickname: string;
  last4Digits: string;
  dueDateDay?: number | null;
  statementDateDay?: number | null;
  creditLimit?: number | null;
}
