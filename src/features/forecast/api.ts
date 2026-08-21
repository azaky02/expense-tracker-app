import { listAccounts, getAccountBalance } from '@/features/accounts/api';
import { listRecurringRules } from '@/features/recurring/api';
import { getMonthRange, todayIso } from '@/lib/dates';

export interface CashFlowForecast {
  currentBalance: number;
  expectedIncome: number;
  expectedPayments: number;
  forecastedBalance: number;
}

/** Projects the end-of-month balance from the current total balance across all accounts plus
 * every recurring rule's occurrences still due before month-end — a simple, transparent formula
 * rather than a statistical model, appropriate for a personal local-only app. */
export async function getCashFlowForecast(): Promise<CashFlowForecast> {
  const { end } = getMonthRange();
  const today = todayIso();

  const accounts = await listAccounts();
  const balances = await Promise.all(accounts.map((a) => getAccountBalance(a.id)));
  const currentBalance = balances.reduce((sum, b) => sum + b, 0);

  const rules = await listRecurringRules();
  let expectedIncome = 0;
  let expectedPayments = 0;

  for (const rule of rules) {
    if (rule.nextOccurrence > today && rule.nextOccurrence <= end) {
      if (rule.type === 'Income') expectedIncome += rule.amount;
      else expectedPayments += rule.amount;
    }
  }

  return {
    currentBalance,
    expectedIncome,
    expectedPayments,
    forecastedBalance: currentBalance + expectedIncome - expectedPayments,
  };
}
