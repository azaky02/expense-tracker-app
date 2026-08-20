import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

/** Internal flags (seed-completed, onboarding, etc). Single-row-per-key table. */
export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const banks = sqliteTable('banks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logoUri: text('logo_uri'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
});

export const banksRelations = relations(banks, ({ many }) => ({
  cards: many(cards),
}));

/**
 * Two-level hierarchy only: `parentCategoryId` NULL = main category, set = sub-category.
 * Enforcing "only one level of nesting" and "transactions must pick a leaf" happens in
 * src/features/categories/validators.ts, not here — SQLite can't express that declaratively.
 */
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  parentCategoryId: text('parent_category_id').references((): AnySQLiteColumn => categories.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  type: text('type', { enum: ['Expense', 'Income'] }).notNull(),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentCategoryId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, { relationName: 'parentChild' }),
  transactions: many(transactions),
}));

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  bankId: text('bank_id')
    .notNull()
    .references(() => banks.id),
  cardType: text('card_type', { enum: ['Visa', 'Mastercard', 'Meeza'] }).notNull(),
  cardCategory: text('card_category', { enum: ['Credit', 'Debit'] }).notNull(),
  nickname: text('nickname').notNull(),
  last4Digits: text('last_4_digits').notNull(),
  /** Day-of-month (1-31), credit cards only. Clamped to each month's real last day at use. */
  dueDateDay: integer('due_date_day'),
  statementDateDay: integer('statement_date_day'),
  creditLimit: real('credit_limit'),
  /** Rotates through theme/cardBrandColors.cardColorRotation at creation; user-editable later. */
  color: text('color').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

export const cardsRelations = relations(cards, ({ one, many }) => ({
  bank: one(banks, { fields: [cards.bankId], references: [banks.id] }),
  transactions: many(transactions),
  scheduledNotifications: many(scheduledNotifications),
}));

/** Fast autocomplete without scanning/DISTINCT-ing the whole transactions table. */
export const beneficiaries = sqliteTable('beneficiaries', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  lastUsedAt: text('last_used_at').notNull(),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    amount: real('amount').notNull(),
    type: text('type', { enum: ['Expense', 'Income'] }).notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    paymentMethodType: text('payment_method_type', { enum: ['Cash', 'Card'] }).notNull(),
    /** Non-null only when paymentMethodType = 'Card' — enforced by the Zod form validator. */
    cardId: text('card_id').references(() => cards.id),
    date: text('date').notNull(), // ISO 8601, Gregorian — the single source of truth (see theme/i18n Hijri conversion)
    /** Free-text note. The long-press "quick note" on the transactions list edits this same column. */
    note: text('note'),
    attachmentUri: text('attachment_uri'), // persistent file:// path in the app's document directory; one max
    beneficiaryName: text('beneficiary_name'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index('transactions_date_idx').on(table.date),
    index('transactions_category_idx').on(table.categoryId),
    index('transactions_card_idx').on(table.cardId),
  ]
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  card: one(cards, { fields: [transactions.cardId], references: [cards.id] }),
}));

/**
 * Tracks which OS-level local notification IDs are currently scheduled per card/policy so the
 * reconciliation engine (src/lib/notifications/scheduler.ts) can cancel-then-reschedule precisely
 * instead of enumerating every pending notification on the device.
 */
export const scheduledNotifications = sqliteTable('scheduled_notifications', {
  id: text('id').primaryKey(),
  cardId: text('card_id').references(() => cards.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['DueDateReminder', 'BudgetAlert', 'DailyReminder'] }).notNull(),
  /** e.g. 3, 7, 1 — days-before-due-date for DueDateReminder policies. */
  daysBefore: integer('days_before'),
  triggerDate: text('trigger_date').notNull(),
  /** The identifier returned by expo-notifications' scheduleNotificationAsync, used to cancel it. */
  osNotificationId: text('os_notification_id').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

export const scheduledNotificationsRelations = relations(scheduledNotifications, ({ one }) => ({
  card: one(cards, { fields: [scheduledNotifications.cardId], references: [cards.id] }),
}));

/** Per-category monthly budget thresholds for FR-5.3 (optional budget-exceeded alerts). */
export const categoryBudgets = sqliteTable('category_budgets', {
  id: text('id').primaryKey(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' })
    .unique(),
  monthlyLimit: real('monthly_limit').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

/** User-configurable notification preferences (the mandatory 3-day card reminder is NOT stored
 * here — it is always-on and never surfaced as a togglable row, see Notification Settings screen). */
export const notificationPreferences = sqliteTable('notification_preferences', {
  key: text('key').primaryKey(), // 'extraDueDateReminders' | 'dailyLogReminder' | 'weeklyLogReminder'
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false),
  /** JSON-encoded config specific to the key, e.g. `{"daysBefore":[7,1]}` or `{"hour":20}`. */
  config: text('config'),
});
