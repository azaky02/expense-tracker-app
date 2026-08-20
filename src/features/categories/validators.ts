import { z } from 'zod';

import type { CategoryRecord } from './types';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  color: z.string().trim().min(1),
  type: z.enum(['Expense', 'Income']),
  parentCategoryId: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

/** Only one level of nesting is allowed — a sub-category (parentCategoryId set) can't itself be a parent. */
export function canBeSubcategoryParent(candidate: CategoryRecord): boolean {
  return candidate.parentCategoryId === null;
}
