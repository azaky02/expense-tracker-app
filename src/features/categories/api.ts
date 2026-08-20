import * as Crypto from 'expo-crypto';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { categories } from '@/db/schema';

import type { CategoryRecord, CategoryTreeNode } from './types';

export async function listCategories(type?: 'Expense' | 'Income'): Promise<CategoryRecord[]> {
  const rows = type ? await db.select().from(categories).where(eq(categories.type, type)) : await db.select().from(categories);
  return rows;
}

export async function getCategory(id: string): Promise<CategoryRecord | undefined> {
  const [row] = await db.select().from(categories).where(eq(categories.id, id));
  return row;
}

/** Groups categories into main categories with their (at most one level of) children. */
export async function listCategoryTree(type?: 'Expense' | 'Income'): Promise<CategoryTreeNode[]> {
  const all = await listCategories(type);
  const mains = all.filter((c) => c.parentCategoryId === null);
  return mains.map((main) => ({
    ...main,
    children: all.filter((c) => c.parentCategoryId === main.id),
  }));
}

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  type: 'Expense' | 'Income';
  parentCategoryId?: string | null;
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const id = Crypto.randomUUID();
  await db.insert(categories).values({
    id,
    parentCategoryId: input.parentCategoryId ?? null,
    name: input.name,
    icon: input.icon,
    color: input.color,
    type: input.type,
    isDefault: false,
  });
  return id;
}

export async function updateCategory(id: string, input: Omit<CategoryInput, 'parentCategoryId'>): Promise<void> {
  await db
    .update(categories)
    .set({ name: input.name, icon: input.icon, color: input.color, type: input.type })
    .where(eq(categories.id, id));
}

export async function deleteCategory(id: string): Promise<void> {
  await db.delete(categories).where(eq(categories.id, id));
}
