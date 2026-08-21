import { listAccounts } from '@/features/accounts/api';
import { listRecurringRules } from '@/features/recurring/api';
import { clampDayToMonth, toIsoDate } from '@/lib/dates';

import type { UpcomingPaymentItem } from './types';

/** Combines recurring-expense next-occurrences and credit-card due dates into one sorted list,
 * looking `daysAhead` days into the future — the "Bills & Upcoming Payments" screen from the
 * requirements doc, unified with the existing card due-date concept rather than a third system. */
export async function getUpcomingPayments(daysAhead = 30): Promise<UpcomingPaymentItem[]> {
  const today = new Date();
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + daysAhead);
  const horizonIso = toIsoDate(horizon);

  const [rules, accounts] = await Promise.all([listRecurringRules(), listAccounts()]);

  const items: UpcomingPaymentItem[] = [];

  for (const rule of rules) {
    if (rule.type !== 'Expense') continue;
    if (rule.nextOccurrence <= horizonIso) {
      items.push({ id: `recurring-${rule.id}`, label: rule.name, date: rule.nextOccurrence, amount: rule.amount, source: 'Recurring' });
    }
  }

  for (const account of accounts) {
    if (account.type !== 'CreditCard' || !account.dueDateDay) continue;
    const thisMonthDay = clampDayToMonth(today.getFullYear(), today.getMonth(), account.dueDateDay);
    let candidate = new Date(today.getFullYear(), today.getMonth(), thisMonthDay);
    if (candidate < today) {
      const nextMonthDay = clampDayToMonth(today.getFullYear(), today.getMonth() + 1, account.dueDateDay);
      candidate = new Date(today.getFullYear(), today.getMonth() + 1, nextMonthDay);
    }
    const candidateIso = toIsoDate(candidate);
    if (candidateIso <= horizonIso) {
      items.push({ id: `card-${account.id}`, label: account.name, date: candidateIso, amount: null, source: 'CardDue' });
    }
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}
