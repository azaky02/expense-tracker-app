import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categoryBudgets } from '@/db/schema';

export interface CategoryBudgetRecord {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  isEnabled: boolean;
}

export async function listCategoryBudgets(): Promise<CategoryBudgetRecord[]> {
  return db.select().from(categoryBudgets);
}

export async function getCategoryBudget(categoryId: string): Promise<CategoryBudgetRecord | undefined> {
  const [row] = await db.select().from(categoryBudgets).where(eq(categoryBudgets.categoryId, categoryId));
  return row;
}

export async function setCategoryBudget(categoryId: string, monthlyLimit: number, isEnabled: boolean): Promise<void> {
  const existing = await getCategoryBudget(categoryId);
  if (existing) {
    await db.update(categoryBudgets).set({ monthlyLimit, isEnabled }).where(eq(categoryBudgets.categoryId, categoryId));
  } else {
    await db.insert(categoryBudgets).values({ id: Crypto.randomUUID(), categoryId, monthlyLimit, isEnabled });
  }
}

export async function deleteCategoryBudget(categoryId: string): Promise<void> {
  await db.delete(categoryBudgets).where(eq(categoryBudgets.categoryId, categoryId));
}
