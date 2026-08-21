import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { accounts, goals } from '@/db/schema';
import { getAccountBalance } from '@/features/accounts/api';
import { todayIso } from '@/lib/dates';

import type { GoalInput, GoalRecord, GoalWithProgress } from './types';

const selection = {
  id: goals.id,
  name: goals.name,
  targetAmount: goals.targetAmount,
  targetDate: goals.targetDate,
  linkedAccountId: goals.linkedAccountId,
  linkedAccountName: accounts.name,
  isActive: goals.isActive,
};

function baseQuery() {
  return db.select(selection).from(goals).leftJoin(accounts, eq(goals.linkedAccountId, accounts.id));
}

export async function listGoals(): Promise<GoalRecord[]> {
  const rows = await baseQuery().where(eq(goals.isActive, true));
  return rows as GoalRecord[];
}

export async function getGoal(id: string): Promise<GoalRecord | undefined> {
  const [row] = await baseQuery().where(eq(goals.id, id));
  return row as GoalRecord | undefined;
}

function monthsBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  return Math.max(1, months);
}

export async function getGoalWithProgress(id: string): Promise<GoalWithProgress | undefined> {
  const goal = await getGoal(id);
  if (!goal) return undefined;
  const savedAmount = Math.max(0, await getAccountBalance(goal.linkedAccountId));
  const pct = goal.targetAmount > 0 ? (savedAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - savedAmount);
  const suggestedMonthlyAmount = goal.targetDate ? remaining / monthsBetween(todayIso(), goal.targetDate) : null;
  return { ...goal, savedAmount, pct, suggestedMonthlyAmount };
}

export async function listGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const rows = await listGoals();
  const results: GoalWithProgress[] = [];
  for (const goal of rows) {
    const withProgress = await getGoalWithProgress(goal.id);
    if (withProgress) results.push(withProgress);
  }
  return results;
}

export async function createGoal(input: GoalInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(goals).values({
    id,
    name: input.name,
    targetAmount: input.targetAmount,
    targetDate: input.targetDate ?? null,
    linkedAccountId: input.linkedAccountId,
    isActive: true,
  });
  return id;
}

export async function deactivateGoal(id: string): Promise<void> {
  await db.update(goals).set({ isActive: false }).where(eq(goals.id, id));
}
