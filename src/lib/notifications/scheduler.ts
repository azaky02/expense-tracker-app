import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { scheduledNotifications } from '@/db/schema';
import { listAccounts } from '@/features/accounts/api';
import type { AccountRecord } from '@/features/accounts/types';
import { getNotificationPreference } from '@/features/notifications/api';
import { listRecurringRules } from '@/features/recurring/api';

import { computeDueReminderDates } from './occurrences';

/** Kept small to respect iOS's 64-pending-local-notification cap across all accounts/policies —
 * reconcile() re-tops-up this window on every boot, foreground, and account change. */
const LOOKAHEAD_COUNT = 2;
const MANDATORY_DAYS_BEFORE = 3;

async function cancelExistingForAccount(accountId: string): Promise<void> {
  const rows = await db.select().from(scheduledNotifications).where(eq(scheduledNotifications.accountId, accountId));
  for (const row of rows) {
    await Notifications.cancelScheduledNotificationAsync(row.osNotificationId);
  }
  await db.delete(scheduledNotifications).where(eq(scheduledNotifications.accountId, accountId));
}

async function scheduleDueDateReminder(
  account: AccountRecord,
  daysBefore: number,
  date: Date,
  isMandatory: boolean
): Promise<void> {
  const body = isMandatory
    ? `🔔 تنبيه: باقي ${daysBefore} أيام على ميعاد سداد ${account.name} - ${account.bankName}`
    : `تنبيه: باقي ${daysBefore} أيام على ميعاد سداد ${account.name} - ${account.bankName}`;

  const osNotificationId = await Notifications.scheduleNotificationAsync({
    content: { title: account.name, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });

  await db.insert(scheduledNotifications).values({
    id: Crypto.randomUUID(),
    accountId: account.id,
    type: 'DueDateReminder',
    daysBefore,
    triggerDate: date.toISOString(),
    osNotificationId,
    isEnabled: true,
  });
}

/** Cancels and reschedules every due-date reminder for one credit-card account — call after that
 * account is created/updated/deactivated, so a changed or removed due_date is always reflected. */
export async function reconcileAccountNotifications(account: AccountRecord): Promise<void> {
  await cancelExistingForAccount(account.id);
  if (account.type !== 'CreditCard' || !account.dueDateDay || !account.isActive) return;

  const mandatoryDates = computeDueReminderDates(account.dueDateDay, MANDATORY_DAYS_BEFORE, LOOKAHEAD_COUNT);
  for (const date of mandatoryDates) {
    await scheduleDueDateReminder(account, MANDATORY_DAYS_BEFORE, date, true);
  }

  const extraPref = await getNotificationPreference('extraDueDateReminders');
  if (extraPref?.isEnabled) {
    const extraDays: number[] = extraPref.config ? (JSON.parse(extraPref.config).daysBefore ?? []) : [];
    for (const daysBefore of extraDays.filter((d) => d !== MANDATORY_DAYS_BEFORE)) {
      const dates = computeDueReminderDates(account.dueDateDay, daysBefore, LOOKAHEAD_COUNT);
      for (const date of dates) {
        await scheduleDueDateReminder(account, daysBefore, date, false);
      }
    }
  }
}

/** Reconciles every active credit-card account's reminders — call at app boot, on foreground, and
 * whenever the extraDueDateReminders preference changes (since that affects every account at once). */
export async function reconcileAllAccountNotifications(): Promise<void> {
  const accountRows = await listAccounts();
  for (const account of accountRows) {
    await reconcileAccountNotifications(account);
  }
}

/** Cancels an account's tracked reminders without re-scheduling — used when it's deactivated. */
export async function cancelAccountNotifications(accountId: string): Promise<void> {
  await cancelExistingForAccount(accountId);
}

const DAILY_REMINDER_TYPE = 'DailyReminder' as const;

async function cancelLogReminder(): Promise<void> {
  const rows = await db
    .select()
    .from(scheduledNotifications)
    .where(eq(scheduledNotifications.type, DAILY_REMINDER_TYPE));
  for (const row of rows) {
    await Notifications.cancelScheduledNotificationAsync(row.osNotificationId);
  }
  await db.delete(scheduledNotifications).where(eq(scheduledNotifications.type, DAILY_REMINDER_TYPE));
}

/** Daily "log your expenses" reminder — a plain repeating trigger, no month-arithmetic needed. */
export async function applyLogReminderPreference(enabled: boolean, hour: number): Promise<void> {
  await cancelLogReminder();
  if (!enabled) return;

  const osNotificationId = await Notifications.scheduleNotificationAsync({
    content: { title: 'ميزان', body: 'ما تنساش تسجل مصروفات النهاردة' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
  });

  await db.insert(scheduledNotifications).values({
    id: Crypto.randomUUID(),
    accountId: null,
    type: DAILY_REMINDER_TYPE,
    daysBefore: null,
    triggerDate: new Date().toISOString(),
    osNotificationId,
    isEnabled: true,
  });
}

async function cancelExistingForRecurringRule(recurringRuleId: string): Promise<void> {
  const rows = await db.select().from(scheduledNotifications).where(eq(scheduledNotifications.recurringRuleId, recurringRuleId));
  for (const row of rows) {
    await Notifications.cancelScheduledNotificationAsync(row.osNotificationId);
  }
  await db.delete(scheduledNotifications).where(eq(scheduledNotifications.recurringRuleId, recurringRuleId));
}

/** Cancels and reschedules the upcoming-bill reminder for one recurring Expense rule — only fires
 * if the user opted in via the 'recurringBillReminders' preference (default off, see Settings →
 * Notifications). Unlike card due dates, this is optional-only — there is no mandatory reminder. */
export async function reconcileRecurringRuleNotification(rule: { id: string; name: string; type: 'Expense' | 'Income'; nextOccurrence: string; isActive: boolean }): Promise<void> {
  await cancelExistingForRecurringRule(rule.id);
  if (rule.type !== 'Expense' || !rule.isActive) return;

  const pref = await getNotificationPreference('recurringBillReminders');
  if (!pref?.isEnabled) return;
  const daysBefore: number = pref.config ? (JSON.parse(pref.config).daysBefore ?? 1) : 1;

  const date = new Date(rule.nextOccurrence);
  date.setDate(date.getDate() - daysBefore);
  if (date.getTime() <= Date.now()) return;

  const osNotificationId = await Notifications.scheduleNotificationAsync({
    content: { title: rule.name, body: `🔔 تنبيه: باقي ${daysBefore} يوم على موعد "${rule.name}"` },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });

  await db.insert(scheduledNotifications).values({
    id: Crypto.randomUUID(),
    recurringRuleId: rule.id,
    type: 'RecurringBillReminder',
    daysBefore,
    triggerDate: date.toISOString(),
    osNotificationId,
    isEnabled: true,
  });
}

/** Reconciles every active recurring rule's bill reminder — call at boot/foreground and whenever
 * the recurringBillReminders preference changes (affects every rule at once). */
export async function reconcileAllRecurringRuleNotifications(): Promise<void> {
  const rules = await listRecurringRules();
  for (const rule of rules) {
    await reconcileRecurringRuleNotification(rule);
  }
}

export async function cancelRecurringRuleNotification(recurringRuleId: string): Promise<void> {
  await cancelExistingForRecurringRule(recurringRuleId);
}

/** Fired synchronously from the transaction-save mutation, not pre-scheduled. */
export async function fireBudgetExceededAlert(categoryName: string, spent: number, limit: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'تنبيه ميزانية',
      body: `تجاوزت ميزانية "${categoryName}" الشهرية (${spent.toFixed(0)} من ${limit.toFixed(0)})`,
    },
    trigger: null,
  });
}
