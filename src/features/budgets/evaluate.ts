import { getCategory, listCategories } from '@/features/categories/api';
import { getCategoryGroupMonthTotal } from '@/features/transactions/api';
import { getMonthRange } from '@/lib/dates';
import { fireBudgetExceededAlert } from '@/lib/notifications/scheduler';

import { getCategoryBudget } from './api';

/** Called synchronously right after a transaction is saved — not pre-scheduled, per FR-5.3. */
export async function evaluateBudgetForTransaction(transaction: { categoryId: string; type: 'Expense' | 'Income' }): Promise<void> {
  if (transaction.type !== 'Expense') return;

  const category = await getCategory(transaction.categoryId);
  if (!category) return;
  const mainCategoryId = category.parentCategoryId ?? category.id;

  const budget = await getCategoryBudget(mainCategoryId);
  if (!budget || !budget.isEnabled) return;

  const allCategories = await listCategories();
  const mainCategory = allCategories.find((c) => c.id === mainCategoryId);
  const childIds = allCategories.filter((c) => c.parentCategoryId === mainCategoryId).map((c) => c.id);

  const { start, end } = getMonthRange();
  const spent = await getCategoryGroupMonthTotal([mainCategoryId, ...childIds], start, end);

  if (spent >= budget.monthlyLimit) {
    await fireBudgetExceededAlert(mainCategory?.name ?? '', spent, budget.monthlyLimit);
  }
}
