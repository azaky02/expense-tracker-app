/** All dates are stored/compared as Gregorian 'YYYY-MM-DD' strings — see schema.ts note on transactions.date. */

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthRange(reference: Date = new Date()): { start: string; end: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

/** Clamps a day-of-month (e.g. a card's due date) to that month's actual last valid day. */
export function clampDayToMonth(year: number, monthIndex0: number, day: number): number {
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(day, lastDay);
}

/**
 * Days from today until the next occurrence of a day-of-month due date (this month if it hasn't
 * passed yet, else next month), clamped to each month's real last day. Used for the dashboard's
 * due-soon banner; the full multi-month notification scheduler (src/lib/notifications) reuses the
 * same clamping idea for its occurrence list.
 */
export function daysUntilNextDueDate(dueDateDay: number, reference: Date = new Date()): number {
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const thisMonthDay = clampDayToMonth(today.getFullYear(), today.getMonth(), dueDateDay);
  let candidate = new Date(today.getFullYear(), today.getMonth(), thisMonthDay);
  if (candidate < today) {
    const nextMonthDay = clampDayToMonth(today.getFullYear(), today.getMonth() + 1, dueDateDay);
    candidate = new Date(today.getFullYear(), today.getMonth() + 1, nextMonthDay);
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((candidate.getTime() - today.getTime()) / msPerDay);
}
