import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { scheduledNotifications } from '@/db/schema';
import { listCards } from '@/features/cards/api';
import type { CardRecord } from '@/features/cards/types';
import { getNotificationPreference } from '@/features/notifications/api';

import { computeDueReminderDates } from './occurrences';

/** Kept small to respect iOS's 64-pending-local-notification cap across all cards/policies —
 * reconcile() re-tops-up this window on every boot, foreground, and card change. */
const LOOKAHEAD_COUNT = 2;
const MANDATORY_DAYS_BEFORE = 3;

async function cancelExistingForCard(cardId: string): Promise<void> {
  const rows = await db.select().from(scheduledNotifications).where(eq(scheduledNotifications.cardId, cardId));
  for (const row of rows) {
    await Notifications.cancelScheduledNotificationAsync(row.osNotificationId);
  }
  await db.delete(scheduledNotifications).where(eq(scheduledNotifications.cardId, cardId));
}

async function scheduleDueDateReminder(card: CardRecord, daysBefore: number, date: Date, isMandatory: boolean): Promise<void> {
  const body = isMandatory
    ? `🔔 تنبيه: باقي ${daysBefore} أيام على ميعاد سداد ${card.nickname} - ${card.bankName}`
    : `تنبيه: باقي ${daysBefore} أيام على ميعاد سداد ${card.nickname} - ${card.bankName}`;

  const osNotificationId = await Notifications.scheduleNotificationAsync({
    content: { title: card.nickname, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });

  await db.insert(scheduledNotifications).values({
    id: Crypto.randomUUID(),
    cardId: card.id,
    type: 'DueDateReminder',
    daysBefore,
    triggerDate: date.toISOString(),
    osNotificationId,
    isEnabled: true,
  });
}

/** Cancels and reschedules every due-date reminder for one card — call after that card is
 * created/updated/deactivated, so a changed or removed due_date is always reflected. */
export async function reconcileCardNotifications(card: CardRecord): Promise<void> {
  await cancelExistingForCard(card.id);
  if (card.cardCategory !== 'Credit' || !card.dueDateDay || !card.isActive) return;

  const mandatoryDates = computeDueReminderDates(card.dueDateDay, MANDATORY_DAYS_BEFORE, LOOKAHEAD_COUNT);
  for (const date of mandatoryDates) {
    await scheduleDueDateReminder(card, MANDATORY_DAYS_BEFORE, date, true);
  }

  const extraPref = await getNotificationPreference('extraDueDateReminders');
  if (extraPref?.isEnabled) {
    const extraDays: number[] = extraPref.config ? (JSON.parse(extraPref.config).daysBefore ?? []) : [];
    for (const daysBefore of extraDays.filter((d) => d !== MANDATORY_DAYS_BEFORE)) {
      const dates = computeDueReminderDates(card.dueDateDay, daysBefore, LOOKAHEAD_COUNT);
      for (const date of dates) {
        await scheduleDueDateReminder(card, daysBefore, date, false);
      }
    }
  }
}

/** Reconciles every active card's reminders — call at app boot, on foreground, and whenever
 * the extraDueDateReminders preference changes (since that affects every card at once). */
export async function reconcileAllCardNotifications(): Promise<void> {
  const cards = await listCards();
  for (const card of cards) {
    await reconcileCardNotifications(card);
  }
}

/** Cancels every card's tracked reminders without re-scheduling — used when a card is deactivated. */
export async function cancelCardNotifications(cardId: string): Promise<void> {
  await cancelExistingForCard(cardId);
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
    content: { title: 'المصاريف بتاعتي', body: 'ما تنساش تسجل مصروفات النهاردة' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
  });

  await db.insert(scheduledNotifications).values({
    id: Crypto.randomUUID(),
    cardId: null,
    type: DAILY_REMINDER_TYPE,
    daysBefore: null,
    triggerDate: new Date().toISOString(),
    osNotificationId,
    isEnabled: true,
  });
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
