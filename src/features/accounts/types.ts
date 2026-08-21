export type AccountType = 'CashWallet' | 'BankAccount' | 'DigitalWallet' | 'CreditCard' | 'DebitCard' | 'SavingsAccount';

export const CARD_ACCOUNT_TYPES: AccountType[] = ['CreditCard', 'DebitCard'];

export interface AccountRecord {
  id: string;
  type: AccountType;
  name: string;
  bankId: string | null;
  bankName: string | null;
  cardType: 'Visa' | 'Mastercard' | 'Meeza' | null;
  last4Digits: string | null;
  dueDateDay: number | null;
  statementDateDay: number | null;
  creditLimit: number | null;
  color: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface AccountWithBalance extends AccountRecord {
  balance: number;
  monthSpend: number;
}

export interface AccountInput {
  type: AccountType;
  name: string;
  bankId?: string | null;
  cardType?: 'Visa' | 'Mastercard' | 'Meeza' | null;
  last4Digits?: string | null;
  dueDateDay?: number | null;
  statementDateDay?: number | null;
  creditLimit?: number | null;
}
