import * as Crypto from 'expo-crypto';
import { and, desc, eq, gte, inArray, lte, sum } from 'drizzle-orm';

import { db } from '@/db';
import { beneficiaries, cards, categories, transactions } from '@/db/schema';

import type { CategoryBreakdownItem, TransactionInput, TransactionListItem } from './types';

async function upsertBeneficiary(name: string | null | undefined): Promise<void> {
  const trimmed = name?.trim();
  if (!trimmed) return;
  const now = new Date().toISOString();
  const [existing] = await db.select().from(beneficiaries).where(eq(beneficiaries.name, trimmed));
  if (existing) {
    await db.update(beneficiaries).set({ lastUsedAt: now }).where(eq(beneficiaries.id, existing.id));
  } else {
    await db.insert(beneficiaries).values({ id: Crypto.randomUUID(), name: trimmed, lastUsedAt: now });
  }
}

const listSelection = {
  id: transactions.id,
  amount: transactions.amount,
  type: transactions.type,
  date: transactions.date,
  note: transactions.note,
  attachmentUri: transactions.attachmentUri,
  beneficiaryName: transactions.beneficiaryName,
  paymentMethodType: transactions.paymentMethodType,
  categoryId: transactions.categoryId,
  categoryName: categories.name,
  categoryIcon: categories.icon,
  categoryColor: categories.color,
  cardId: transactions.cardId,
  cardNickname: cards.nickname,
};

function baseListQuery() {
  return db
    .select(listSelection)
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(cards, eq(transactions.cardId, cards.id));
}

export async function createTransaction(input: TransactionInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(transactions).values({
    id,
    amount: input.amount,
    type: input.type,
    categoryId: input.categoryId,
    paymentMethodType: input.paymentMethodType,
    cardId: input.paymentMethodType === 'Card' ? (input.cardId ?? null) : null,
    date: input.date,
    note: input.note ?? null,
    attachmentUri: input.attachmentUri ?? null,
    beneficiaryName: input.beneficiaryName ?? null,
  });
  await upsertBeneficiary(input.beneficiaryName);
  return id;
}

export async function updateTransaction(id: string, input: TransactionInput): Promise<void> {
  await db
    .update(transactions)
    .set({
      amount: input.amount,
      type: input.type,
      categoryId: input.categoryId,
      paymentMethodType: input.paymentMethodType,
      cardId: input.paymentMethodType === 'Card' ? (input.cardId ?? null) : null,
      date: input.date,
      note: input.note ?? null,
      attachmentUri: input.attachmentUri ?? null,
      beneficiaryName: input.beneficiaryName ?? null,
    })
    .where(eq(transactions.id, id));
  await upsertBeneficiary(input.beneficiaryName);
}

export async function updateTransactionNote(id: string, note: string): Promise<void> {
  await db.update(transactions).set({ note }).where(eq(transactions.id, id));
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.delete(transactions).where(eq(transactions.id, id));
}

export async function getTransaction(id: string): Promise<TransactionListItem | undefined> {
  const [row] = await baseListQuery().where(eq(transactions.id, id));
  return row as TransactionListItem | undefined;
}

export async function getRecentTransactions(limit: number): Promise<TransactionListItem[]> {
  const rows = await baseListQuery().orderBy(desc(transactions.date), desc(transactions.createdAt)).limit(limit);
  return rows as TransactionListItem[];
}

export interface TransactionFilters {
  /** Pass the main category's id plus all its children's ids to filter "this category or any of its sub-categories". */
  categoryIds?: string[];
  paymentMethodType?: 'Cash' | 'Card';
  cardId?: string;
  dateStart?: string;
  dateEnd?: string;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<TransactionListItem[]> {
  const conditions = [];
  if (filters.categoryIds && filters.categoryIds.length > 0) conditions.push(inArray(transactions.categoryId, filters.categoryIds));
  if (filters.paymentMethodType) conditions.push(eq(transactions.paymentMethodType, filters.paymentMethodType));
  if (filters.cardId) conditions.push(eq(transactions.cardId, filters.cardId));
  if (filters.dateStart) conditions.push(gte(transactions.date, filters.dateStart));
  if (filters.dateEnd) conditions.push(lte(transactions.date, filters.dateEnd));

  const query = baseListQuery().orderBy(desc(transactions.date), desc(transactions.createdAt));
  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;
  return rows as TransactionListItem[];
}

export interface MonthSummary {
  income: number;
  expense: number;
}

export async function getMonthSummary(monthStart: string, monthEnd: string): Promise<MonthSummary> {
  const rows = await db
    .select({ type: transactions.type, total: sum(transactions.amount) })
    .from(transactions)
    .where(and(gte(transactions.date, monthStart), lte(transactions.date, monthEnd)))
    .groupBy(transactions.type);

  const income = Number(rows.find((r) => r.type === 'Income')?.total ?? 0);
  const expense = Number(rows.find((r) => r.type === 'Expense')?.total ?? 0);
  return { income, expense };
}

/** Rolls sub-category totals up into their main category (one level of nesting only). */
export async function getExpenseCategoryBreakdown(
  monthStart: string,
  monthEnd: string
): Promise<CategoryBreakdownItem[]> {
  const rows = await db
    .select({
      amount: transactions.amount,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryColor: categories.color,
      parentCategoryId: categories.parentCategoryId,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(gte(transactions.date, monthStart), lte(transactions.date, monthEnd), eq(transactions.type, 'Expense'))
    );

  const totals = new Map<string, CategoryBreakdownItem>();
  for (const row of rows) {
    const rollupId = row.parentCategoryId ?? row.categoryId;
    const existing = totals.get(rollupId);
    if (existing) {
      existing.total += row.amount;
    } else {
      totals.set(rollupId, {
        categoryId: rollupId,
        categoryName: row.categoryName,
        categoryColor: row.categoryColor,
        total: row.amount,
      });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

export async function getCategoryMonthTotal(
  categoryId: string,
  monthStart: string,
  monthEnd: string
): Promise<number> {
  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(eq(transactions.categoryId, categoryId), gte(transactions.date, monthStart), lte(transactions.date, monthEnd))
    );
  return Number(row?.total ?? 0);
}

/** Sums an expense category and its sub-categories together (see FR-5.3 budgets, set per main category). */
export async function getCategoryGroupMonthTotal(categoryIds: string[], monthStart: string, monthEnd: string): Promise<number> {
  if (categoryIds.length === 0) return 0;
  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        inArray(transactions.categoryId, categoryIds),
        eq(transactions.type, 'Expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );
  return Number(row?.total ?? 0);
}

export async function getCardMonthSpend(cardId: string, monthStart: string, monthEnd: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.cardId, cardId),
        eq(transactions.type, 'Expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );
  return Number(row?.total ?? 0);
}

export async function getCashMonthSpend(monthStart: string, monthEnd: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.paymentMethodType, 'Cash'),
        eq(transactions.type, 'Expense'),
        gte(transactions.date, monthStart),
        lte(transactions.date, monthEnd)
      )
    );
  return Number(row?.total ?? 0);
}

export async function getCardTransactions(cardId: string): Promise<TransactionListItem[]> {
  const rows = await baseListQuery().where(eq(transactions.cardId, cardId)).orderBy(desc(transactions.date));
  return rows as TransactionListItem[];
}

export interface PaymentMethodBreakdownItem {
  label: string;
  cardId: string | null;
  color: string;
  total: number;
}

/** Cash vs. each card's spend for the month (FR-6.3). */
export async function getExpenseByPaymentMethod(monthStart: string, monthEnd: string): Promise<PaymentMethodBreakdownItem[]> {
  const rows = await db
    .select({
      amount: transactions.amount,
      cardId: transactions.cardId,
      cardNickname: cards.nickname,
      cardColor: cards.color,
    })
    .from(transactions)
    .leftJoin(cards, eq(transactions.cardId, cards.id))
    .where(and(eq(transactions.type, 'Expense'), gte(transactions.date, monthStart), lte(transactions.date, monthEnd)));

  const totals = new Map<string, PaymentMethodBreakdownItem>();
  for (const row of rows) {
    const key = row.cardId ?? 'cash';
    const existing = totals.get(key);
    if (existing) {
      existing.total += row.amount;
    } else {
      totals.set(key, {
        label: row.cardId ? (row.cardNickname ?? '') : 'cash',
        cardId: row.cardId,
        color: row.cardColor ?? '',
        total: row.amount,
      });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.total - a.total);
}

export interface MonthTotal {
  month: string; // 'YYYY-MM'
  expense: number;
  income: number;
}

/** Last `monthsBack` months (oldest first) of expense/income totals, for month-over-month comparison (FR-6.4). */
export async function getMonthOverMonthTotals(monthsBack: number, reference: Date = new Date()): Promise<MonthTotal[]> {
  const results: MonthTotal[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const { start, end } = { start: `${monthKey}-01`, end: `${monthKey}-31` };
    const summary = await getMonthSummary(start, end);
    results.push({ month: monthKey, expense: summary.expense, income: summary.income });
  }
  return results;
}

export interface BeneficiaryBreakdownItem {
  beneficiaryName: string;
  total: number;
}

/** Groups expense spend by beneficiary for the month (FR-1.8.2). */
export async function getBeneficiaryBreakdown(monthStart: string, monthEnd: string): Promise<BeneficiaryBreakdownItem[]> {
  const rows = await db
    .select({ amount: transactions.amount, beneficiaryName: transactions.beneficiaryName })
    .from(transactions)
    .where(and(eq(transactions.type, 'Expense'), gte(transactions.date, monthStart), lte(transactions.date, monthEnd)));

  const totals = new Map<string, number>();
  for (const row of rows) {
    const name = row.beneficiaryName?.trim();
    if (!name) continue;
    totals.set(name, (totals.get(name) ?? 0) + row.amount);
  }
  return Array.from(totals.entries())
    .map(([beneficiaryName, total]) => ({ beneficiaryName, total }))
    .sort((a, b) => b.total - a.total);
}
