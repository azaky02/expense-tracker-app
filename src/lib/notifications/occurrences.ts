import { clampDayToMonth } from '@/lib/dates';

/**
 * Next `count` future dates for "daysBefore days before the dueDateDay-of-month", stepping
 * month-by-month and clamping to each month's real last day (so due day 31 lands on Feb 28, etc).
 * Kept small (see LOOKAHEAD_COUNT in scheduler.ts) to respect iOS's 64-pending-notification cap —
 * reconcile() re-tops-up the window every time a card changes or the app comes to the foreground.
 */
export function computeDueReminderDates(dueDateDay: number, daysBefore: number, count: number, reference: Date = new Date()): Date[] {
  const dates: Date[] = [];
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  let year = reference.getFullYear();
  let month = reference.getMonth();

  // Cap iterations defensively — this loop always terminates in practice (each pass advances one
  // calendar month and count is small), but a hard ceiling avoids any theoretical infinite loop.
  for (let guard = 0; guard < 240 && dates.length < count; guard += 1) {
    const dueDay = clampDayToMonth(year, month, dueDateDay);
    const dueDate = new Date(year, month, dueDay);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    if (reminderDate >= today) {
      dates.push(reminderDate);
    }

    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return dates;
}
