CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`bank_id` text,
	`card_type` text,
	`last_4_digits` text,
	`due_date_day` integer,
	`statement_date_day` integer,
	`credit_limit` real,
	`color` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `banks` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo_uri` text,
	`is_custom` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `beneficiaries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`last_used_at` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beneficiaries_name_unique` ON `beneficiaries` (`name`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_category_id` text,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`type` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`parent_category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `category_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`monthly_limit` real NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `category_budgets_category_id_unique` ON `category_budgets` (`category_id`);--> statement-breakpoint
CREATE TABLE `custody_records` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`reason` text,
	`original_amount` real NOT NULL,
	`remaining_amount` real NOT NULL,
	`status` text DEFAULT 'Open' NOT NULL,
	`received_date` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `custody_settlements` (
	`id` text PRIMARY KEY NOT NULL,
	`custody_record_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`custody_record_id`) REFERENCES `custody_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`target_date` text,
	`linked_account_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`linked_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `income_details` (
	`transaction_id` text PRIMARY KEY NOT NULL,
	`person_id` text,
	`employer` text,
	`pay_period` text,
	`employer_due_date` text,
	`reason` text,
	`sender_name` text,
	`reference_note` text,
	`source` text,
	`description` text,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`key` text PRIMARY KEY NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`config` text
);
--> statement-breakpoint
CREATE TABLE `people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`account_id` text NOT NULL,
	`income_type` text,
	`amount` real NOT NULL,
	`note` text,
	`beneficiary_name` text,
	`frequency` text NOT NULL,
	`interval_days` integer,
	`next_occurrence` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scheduled_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text,
	`recurring_rule_id` text,
	`type` text NOT NULL,
	`days_before` integer,
	`trigger_date` text NOT NULL,
	`os_notification_id` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recurring_rule_id`) REFERENCES `recurring_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`account_id` text NOT NULL,
	`income_type` text,
	`date` text NOT NULL,
	`note` text,
	`attachment_uri` text,
	`beneficiary_name` text,
	`recurring_rule_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_account_idx` ON `transactions` (`account_id`);--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`from_account_id` text NOT NULL,
	`to_account_id` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`note` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`from_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`to_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
