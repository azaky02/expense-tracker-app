import React from 'react';

import { Text } from '@/components/Text';
import { useCategoryMonthTotal } from '@/features/transactions/hooks';
import { getMonthRange } from '@/lib/dates';

import { useCategoryBudget } from '../hooks';
import { budgetBandColor, getBudgetStatus } from '../status';

/** Small inline "71%" badge shown next to a category row that has an enabled budget. */
export function CategoryBudgetBadge({ categoryId }: { categoryId: string }) {
  const { data: budget } = useCategoryBudget(categoryId);
  const { start, end } = getMonthRange();
  const { data: spent } = useCategoryMonthTotal(categoryId, start, end, !!budget?.isEnabled);

  if (!budget?.isEnabled || !budget.monthlyLimit) return null;
  const { pct, band } = getBudgetStatus(spent ?? 0, budget.monthlyLimit);

  return (
    <Text variant="caption" color={budgetBandColor(band)} style={{ marginEnd: 8 }}>
      {Math.round(pct)}%
    </Text>
  );
}
