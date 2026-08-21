export type BudgetBand = 'normal' | 'earlyWarning' | 'warning' | 'exceeded';

export interface BudgetStatus {
  pct: number; // 0-100+, clamped for display purposes by the caller if needed
  band: BudgetBand;
}

/** Thresholds per the Version 2 requirements doc: 0-70% normal, 71-89% early warning,
 * 90-100% warning, >100% exceeded. */
export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return { pct: 0, band: 'normal' };
  const pct = (spent / limit) * 100;
  let band: BudgetBand = 'normal';
  if (pct > 100) band = 'exceeded';
  else if (pct >= 90) band = 'warning';
  else if (pct >= 71) band = 'earlyWarning';
  return { pct, band };
}

export function budgetBandColor(band: BudgetBand): 'income' | 'warning' | 'danger' {
  if (band === 'exceeded') return 'danger';
  if (band === 'warning' || band === 'earlyWarning') return 'warning';
  return 'income';
}
