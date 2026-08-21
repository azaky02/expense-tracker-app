import * as Crypto from 'expo-crypto';

import { db } from '@/db';
import { transactions } from '@/db/schema';
import { evaluateBudgetForTransaction } from '@/features/budgets/evaluate';
import { todayIso } from '@/lib/dates';

import { advanceRecurringRuleOccurrence, listRecurringRules } from './api';
import { advanceOccurrence } from './occurrences';

/** Safety cap per rule per run, in case the app hasn't been opened in a very long time. */
const MAX_CATCHUP_PER_RULE = 24;

/**
 * Generates the real `transactions` rows for every recurring rule whose nextOccurrence has
 * already passed, then advances each rule to its next future occurrence. Call this once on app
 * boot (see src/app/_layout.tsx) — there is no reliable background execution in this local-only,
 * no-server app, so catch-up-on-open is the simplest correct approach.
 */
export async function runRecurringCatchUp(): Promise<void> {
  const today = todayIso();
  const rules = await listRecurringRules();

  for (const rule of rules) {
    let occurrence = rule.nextOccurrence;
    let iterations = 0;

    while (occurrence <= today && iterations < MAX_CATCHUP_PER_RULE) {
      const id = Crypto.randomUUID();
      await db.insert(transactions).values({
        id,
        amount: rule.amount,
        type: rule.type,
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        incomeType: rule.type === 'Income' ? rule.incomeType : null,
        date: occurrence,
        note: rule.note,
        beneficiaryName: rule.beneficiaryName,
        recurringRuleId: rule.id,
      });
      await evaluateBudgetForTransaction({ categoryId: rule.categoryId, type: rule.type });

      occurrence = advanceOccurrence(occurrence, rule.frequency, rule.intervalDays);
      iterations += 1;
    }

    if (occurrence !== rule.nextOccurrence) {
      await advanceRecurringRuleOccurrence(rule.id, occurrence);
    }
  }
}
