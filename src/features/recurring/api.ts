import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, categories, recurringRules } from '@/db/schema';

import type { RecurringRuleInput, RecurringRuleRecord } from './types';

const selection = {
  id: recurringRules.id,
  name: recurringRules.name,
  type: recurringRules.type,
  categoryId: recurringRules.categoryId,
  categoryName: categories.name,
  accountId: recurringRules.accountId,
  accountName: accounts.name,
  incomeType: recurringRules.incomeType,
  amount: recurringRules.amount,
  note: recurringRules.note,
  beneficiaryName: recurringRules.beneficiaryName,
  frequency: recurringRules.frequency,
  intervalDays: recurringRules.intervalDays,
  nextOccurrence: recurringRules.nextOccurrence,
  isActive: recurringRules.isActive,
};

function baseQuery() {
  return db
    .select(selection)
    .from(recurringRules)
    .leftJoin(categories, eq(recurringRules.categoryId, categories.id))
    .leftJoin(accounts, eq(recurringRules.accountId, accounts.id));
}

export async function listRecurringRules(): Promise<RecurringRuleRecord[]> {
  const rows = await baseQuery().where(eq(recurringRules.isActive, true));
  return rows as RecurringRuleRecord[];
}

export async function getRecurringRule(id: string): Promise<RecurringRuleRecord | undefined> {
  const [row] = await baseQuery().where(eq(recurringRules.id, id));
  return row as RecurringRuleRecord | undefined;
}

export async function createRecurringRule(input: RecurringRuleInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(recurringRules).values({
    id,
    name: input.name,
    type: input.type,
    categoryId: input.categoryId,
    accountId: input.accountId,
    incomeType: input.type === 'Income' ? (input.incomeType ?? null) : null,
    amount: input.amount,
    note: input.note ?? null,
    beneficiaryName: input.beneficiaryName ?? null,
    frequency: input.frequency,
    intervalDays: input.frequency === 'Custom' ? (input.intervalDays ?? 1) : null,
    nextOccurrence: input.startDate,
    isActive: true,
  });
  return id;
}

export async function deactivateRecurringRule(id: string): Promise<void> {
  await db.update(recurringRules).set({ isActive: false }).where(eq(recurringRules.id, id));
}

/** Permanently removes the rule itself — transactions it already generated are untouched (they
 * keep their recurringRuleId for history, but the rule no longer exists to generate more). */
export async function deleteRecurringRule(id: string): Promise<void> {
  await db.delete(recurringRules).where(eq(recurringRules.id, id));
}

export async function updateRecurringRule(id: string, input: RecurringRuleInput): Promise<void> {
  await db
    .update(recurringRules)
    .set({
      name: input.name,
      type: input.type,
      categoryId: input.categoryId,
      accountId: input.accountId,
      incomeType: input.type === 'Income' ? (input.incomeType ?? null) : null,
      amount: input.amount,
      note: input.note ?? null,
      beneficiaryName: input.beneficiaryName ?? null,
      frequency: input.frequency,
      intervalDays: input.frequency === 'Custom' ? (input.intervalDays ?? 1) : null,
    })
    .where(eq(recurringRules.id, id));
}

export async function advanceRecurringRuleOccurrence(id: string, nextOccurrence: string): Promise<void> {
  await db.update(recurringRules).set({ nextOccurrence }).where(eq(recurringRules.id, id));
}
