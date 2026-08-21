import { toIsoDate } from '@/lib/dates';

import type { RecurringFrequency } from './types';

/** Advances an ISO date by one occurrence of the given frequency. */
export function advanceOccurrence(isoDate: string, frequency: RecurringFrequency, intervalDays?: number | null): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  switch (frequency) {
    case 'Daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'Weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'Monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'Yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'Custom':
      date.setDate(date.getDate() + Math.max(1, intervalDays ?? 1));
      break;
  }
  return toIsoDate(date);
}
