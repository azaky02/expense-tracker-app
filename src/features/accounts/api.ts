import * as Crypto from 'expo-crypto';
import { and, eq, gte, lte, sum } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, banks, transactions, transfers } from '@/db/schema';
import { nextCardColor } from '@/theme/cardBrandColors';

import type { AccountInput, AccountRecord, AccountWithBalance } from './types';

const selection = {
  id: accounts.id,
  type: accounts.type,
  name: accounts.name,
  bankId: accounts.bankId,
  bankName: banks.name,
  cardType: accounts.cardType,
  last4Digits: accounts.last4Digits,
  dueDateDay: accounts.dueDateDay,
  statementDateDay: accounts.statementDateDay,
  creditLimit: accounts.creditLimit,
  color: accounts.color,
  isActive: accounts.isActive,
  isDefault: accounts.isDefault,
};

export async function listAccounts(): Promise<AccountRecord[]> {
  const rows = await db
    .select(selection)
    .from(accounts)
    .leftJoin(banks, eq(accounts.bankId, banks.id))
    .where(eq(accounts.isActive, true));
  return rows as AccountRecord[];
}

export async function getAccount(id: string): Promise<AccountRecord | undefined> {
  const [row] = await db.select(selection).from(accounts).leftJoin(banks, eq(accounts.bankId, banks.id)).where(eq(accounts.id, id));
  return row as AccountRecord | undefined;
}

/** Ensures the single synthetic "Cash" account exists — called once on first boot. */
export async function ensureDefaultCashAccount(): Promise<void> {
  const [existing] = await db.select().from(accounts).where(eq(accounts.isDefault, true));
  if (existing) return;
  await db.insert(accounts).values({
    id: Crypto.randomUUID(),
    type: 'CashWallet',
    name: 'Cash',
    color: nextCardColor(0),
    isActive: true,
    isDefault: true,
  });
}

export async function createAccount(input: AccountInput): Promise<string> {
  const id = Crypto.randomUUID();
  const isCardLike = input.type === 'CreditCard' || input.type === 'DebitCard';
  const existingCount = (await db.select().from(accounts)).length;
  await db.insert(accounts).values({
    id,
    type: input.type,
    name: input.name,
    bankId: input.bankId ?? null,
    cardType: isCardLike ? (input.cardType ?? null) : null,
    last4Digits: isCardLike ? (input.last4Digits ?? null) : null,
    dueDateDay: input.type === 'CreditCard' ? (input.dueDateDay ?? null) : null,
    statementDateDay: input.type === 'CreditCard' ? (input.statementDateDay ?? null) : null,
    creditLimit: input.type === 'CreditCard' ? (input.creditLimit ?? null) : null,
    color: nextCardColor(existingCount),
    isActive: true,
    isDefault: false,
  });
  return id;
}

export async function updateAccount(id: string, input: AccountInput): Promise<void> {
  const isCardLike = input.type === 'CreditCard' || input.type === 'DebitCard';
  await db
    .update(accounts)
    .set({
      type: input.type,
      name: input.name,
      bankId: input.bankId ?? null,
      cardType: isCardLike ? (input.cardType ?? null) : null,
      last4Digits: isCardLike ? (input.last4Digits ?? null) : null,
      dueDateDay: input.type === 'CreditCard' ? (input.dueDateDay ?? null) : null,
      statementDateDay: input.type === 'CreditCard' ? (input.statementDateDay ?? null) : null,
      creditLimit: input.type === 'CreditCard' ? (input.creditLimit ?? null) : null,
    })
    .where(eq(accounts.id, id));
}

export async function deactivateAccount(id: string): Promise<void> {
  await db.update(accounts).set({ isActive: false }).where(eq(accounts.id, id));
}

/** Real balance = income (real, non-custody) - expense + transfers in - transfers out, all computed on read. */
export async function getAccountBalance(accountId: string): Promise<number> {
  const [incomeRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.type, 'Income')));
  const [expenseRow] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(eq(transactions.accountId, accountId), eq(transactions.type, 'Expense')));
  const [transfersInRow] = await db
    .select({ total: sum(transfers.amount) })
    .from(transfers)
    .where(eq(transfers.toAccountId, accountId));
  const [transfersOutRow] = await db
    .select({ total: sum(transfers.amount) })
    .from(transfers)
    .where(eq(transfers.fromAccountId, accountId));

  const income = Number(incomeRow?.total ?? 0);
  const expense = Number(expenseRow?.total ?? 0);
  const transfersIn = Number(transfersInRow?.total ?? 0);
  const transfersOut = Number(transfersOutRow?.total ?? 0);
  return income - expense + transfersIn - transfersOut;
}

export async function getAccountMonthSpend(accountId: string, monthStart: string, monthEnd: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        eq(transactions.type, 'Expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );
  return Number(row?.total ?? 0);
}

/** Batched version of listAccounts + getAccountBalance/getAccountMonthSpend, avoiding N+1 queries. */
export async function listAccountsWithBalances(monthStart: string, monthEnd: string): Promise<AccountWithBalance[]> {
  const accountRows = await listAccounts();
  const result: AccountWithBalance[] = [];
  for (const account of accountRows) {
    const [balance, monthSpend] = await Promise.all([
      getAccountBalance(account.id),
      getAccountMonthSpend(account.id, monthStart, monthEnd),
    ]);
    result.push({ ...account, balance, monthSpend });
  }
  return result;
}
