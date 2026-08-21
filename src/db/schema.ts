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
  accounts: many(accounts),
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

/**
 * Unified "money source" for the user: cash, bank accounts, digital wallets, savings accounts,
 * and credit/debit cards. Replaces the old standalone `cards` table + transactions'
 * paymentMethodType/cardId pair — every transaction now points at one accountId.
 * Field validity per `type` (e.g. last4Digits only for card-like types, dueDateDay/creditLimit
 * only for CreditCard) is enforced in src/features/accounts/validators.ts, not here.
 */
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  type: text('type', {
    enum: ['CashWallet', 'BankAccount', 'DigitalWallet', 'CreditCard', 'DebitCard', 'SavingsAccount'],
  }).notNull(),
  name: text('name').notNull(),
  bankId: text('bank_id').references(() => banks.id),
  cardType: text('card_type', { enum: ['Visa', 'Mastercard', 'Meeza'] }),
  last4Digits: text('last_4_digits'),
  /** Day-of-month (1-31), credit-card accounts only. Clamped to each month's real last day at use. */
  dueDateDay: integer('due_date_day'),
  statementDateDay: integer('statement_date_day'),
  creditLimit: real('credit_limit'),
  /** Rotates through theme/cardBrandColors.cardColorRotation at creation; user-editable later. */
  color: text('color').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  /** Marks the single synthetic "Cash" account seeded on first boot — cannot be deleted. */
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  bank: one(banks, { fields: [accounts.bankId], references: [banks.id] }),
  transactions: many(transactions),
  scheduledNotifications: many(scheduledNotifications),
  transfersOut: many(transfers, { relationName: 'fromAccount' }),
  transfersIn: many(transfers, { relationName: 'toAccount' }),
}));

/** Fast autocomplete without scanning/DISTINCT-ing the whole transactions table. */
export const beneficiaries = sqliteTable('beneficiaries', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  lastUsedAt: text('last_used_at').notNull(),
  /** At most one row is true at a time — pre-selected automatically when adding a new expense. */
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
});

/**
 * Real people, used by Custody records and optionally by some Income sub-types (Cash Receipt).
 * Distinct from `beneficiaries` (a free-text autocomplete cache for expense payees) — a Person is
 * a proper relation because Custody needs to track a running relationship/history with them.
 */
export const people = sqliteTable('people', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
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
    accountId: text('account_id')
      .notNull()
      .references(() => accounts.id),
    /** Only set when type = 'Income'. Custody is NOT a value here — custody receipts are never
     * inserted into this table at all, see `custodyRecords` below. */
    incomeType: text('income_type', { enum: ['Salary', 'CashReceipt', 'IncomingTransfer', 'Other'] }),
    date: text('date').notNull(), // ISO 8601, Gregorian — the single source of truth (see theme/i18n Hijri conversion)
    /** Free-text note. The long-press "quick note" on the transactions list edits this same column. */
    note: text('note'),
    attachmentUri: text('attachment_uri'), // persistent file:// path in the app's document directory; one max
    beneficiaryName: text('beneficiary_name'),
    /** Set when this row was auto-generated by the recurring-transactions engine — see recurringRules. */
    recurringRuleId: text('recurring_rule_id'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (table) => [
    index('transactions_date_idx').on(table.date),
    index('transactions_category_idx').on(table.categoryId),
    index('transactions_account_idx').on(table.accountId),
  ]
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, { fields: [transactions.categoryId], references: [categories.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  incomeDetails: one(incomeDetails, { fields: [transactions.id], references: [incomeDetails.transactionId] }),
}));

/**
 * Extra fields for non-Custody income sub-types, 1:1 with a transactions row. Small/stable field
 * sets per sub-type, kept nullable and shared in one table rather than four near-identical ones.
 */
export const incomeDetails = sqliteTable('income_details', {
  transactionId: text('transaction_id')
    .primaryKey()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  /** Optional person link — Cash Receipt / Other. */
  personId: text('person_id').references(() => people.id),
  employer: text('employer'), // Salary
  payPeriod: text('pay_period'), // Salary, e.g. '2026-08'
  employerDueDate: text('employer_due_date'), // Salary
  reason: text('reason'), // Cash Receipt
  senderName: text('sender_name'), // Incoming Transfer
  referenceNote: text('reference_note'), // Incoming Transfer
  source: text('source'), // Other
  description: text('description'), // Other
});

export const incomeDetailsRelations = relations(incomeDetails, ({ one }) => ({
  transaction: one(transactions, { fields: [incomeDetails.transactionId], references: [transactions.id] }),
  person: one(people, { fields: [incomeDetails.personId], references: [people.id] }),
}));

/**
 * Custody ("أمانة") records live entirely outside the transactions/accounts model by design: the
 * money is not the user's real income and must never touch an account balance or income totals.
 * It is surfaced only as its own separate "أموال تحت الأمانة" total (sum of remainingAmount).
 */
export const custodyRecords = sqliteTable('custody_records', {
  id: text('id').primaryKey(),
  personId: text('person_id')
    .notNull()
    .references(() => people.id),
  reason: text('reason'),
  originalAmount: real('original_amount').notNull(),
  /** Maintained by the app (src/features/custody/api.ts), not a DB trigger — recomputed after
   * every settlement as originalAmount - SUM(settlements.amount). */
  remainingAmount: real('remaining_amount').notNull(),
  status: text('status', { enum: ['Open', 'PartiallyReturned', 'Closed'] })
    .notNull()
    .default('Open'),
  receivedDate: text('received_date').notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const custodyRecordsRelations = relations(custodyRecords, ({ one, many }) => ({
  person: one(people, { fields: [custodyRecords.personId], references: [people.id] }),
  settlements: many(custodySettlements),
}));

/** One row per full/partial return of a custody amount to its owner. */
export const custodySettlements = sqliteTable('custody_settlements', {
  id: text('id').primaryKey(),
  custodyRecordId: text('custody_record_id')
    .notNull()
    .references(() => custodyRecords.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const custodySettlementsRelations = relations(custodySettlements, ({ one }) => ({
  custodyRecord: one(custodyRecords, { fields: [custodySettlements.custodyRecordId], references: [custodyRecords.id] }),
}));

/**
 * Money moved between two of the user's own accounts. Never income or expense — kept in its own
 * table (not two transactions rows) so it's automatically excluded from every income/expense/
 * category/budget aggregate, which all read from `transactions` only.
 */
export const transfers = sqliteTable('transfers', {
  id: text('id').primaryKey(),
  fromAccountId: text('from_account_id')
    .notNull()
    .references(() => accounts.id),
  toAccountId: text('to_account_id')
    .notNull()
    .references(() => accounts.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const transfersRelations = relations(transfers, ({ one }) => ({
  fromAccount: one(accounts, { fields: [transfers.fromAccountId], references: [accounts.id], relationName: 'fromAccount' }),
  toAccount: one(accounts, { fields: [transfers.toAccountId], references: [accounts.id], relationName: 'toAccount' }),
}));

/**
 * Tracks which OS-level local notification IDs are currently scheduled per account/policy so the
 * reconciliation engine (src/lib/notifications/scheduler.ts) can cancel-then-reschedule precisely
 * instead of enumerating every pending notification on the device.
 */
export const scheduledNotifications = sqliteTable('scheduled_notifications', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  recurringRuleId: text('recurring_rule_id').references((): AnySQLiteColumn => recurringRules.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['DueDateReminder', 'BudgetAlert', 'DailyReminder', 'RecurringBillReminder'] }).notNull(),
  /** e.g. 3, 7, 1 — days-before-due-date for DueDateReminder policies. */
  daysBefore: integer('days_before'),
  triggerDate: text('trigger_date').notNull(),
  /** The identifier returned by expo-notifications' scheduleNotificationAsync, used to cancel it. */
  osNotificationId: text('os_notification_id').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});

export const scheduledNotificationsRelations = relations(scheduledNotifications, ({ one }) => ({
  account: one(accounts, { fields: [scheduledNotifications.accountId], references: [accounts.id] }),
  recurringRule: one(recurringRules, { fields: [scheduledNotifications.recurringRuleId], references: [recurringRules.id] }),
}));

/**
 * A template for a transaction that repeats on a schedule (subscriptions, salary, rent, ...).
 * On each app boot the recurring engine (src/features/recurring/engine.ts) catches up any rule
 * whose nextOccurrence has passed by creating the real `transactions` row and advancing the date.
 */
export const recurringRules = sqliteTable('recurring_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['Expense', 'Income'] }).notNull(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  incomeType: text('income_type', { enum: ['Salary', 'CashReceipt', 'IncomingTransfer', 'Other'] }),
  amount: real('amount').notNull(),
  note: text('note'),
  beneficiaryName: text('beneficiary_name'),
  frequency: text('frequency', { enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', 'Custom'] }).notNull(),
  /** Only for frequency = 'Custom' — repeat every N days. */
  intervalDays: integer('interval_days'),
  /** ISO date of the next transaction this rule should generate; advanced after each catch-up run. */
  nextOccurrence: text('next_occurrence').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const recurringRulesRelations = relations(recurringRules, ({ one }) => ({
  category: one(categories, { fields: [recurringRules.categoryId], references: [categories.id] }),
  account: one(accounts, { fields: [recurringRules.accountId], references: [accounts.id] }),
}));

/**
 * A savings target. Progress is read directly from its linked account's computed balance (see
 * getAccountBalance in accounts/api.ts) rather than a separate contributions ledger — consistent
 * with this schema's "app computes on read" philosophy and avoids double-booking money that's
 * already tracked via ordinary transactions/transfers into that account.
 */
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  targetDate: text('target_date'),
  linkedAccountId: text('linked_account_id')
    .notNull()
    .references(() => accounts.id),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const goalsRelations = relations(goals, ({ one }) => ({
  linkedAccount: one(accounts, { fields: [goals.linkedAccountId], references: [accounts.id] }),
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
