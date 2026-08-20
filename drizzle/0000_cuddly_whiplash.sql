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
	`last_used_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `beneficiaries_name_unique` ON `beneficiaries` (`name`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`bank_id` text NOT NULL,
	`card_type` text NOT NULL,
	`card_category` text NOT NULL,
	`nickname` text NOT NULL,
	`last_4_digits` text NOT NULL,
	`due_date_day` integer,
	`statement_date_day` integer,
	`credit_limit` real,
	`color` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`bank_id`) REFERENCES `banks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
CREATE TABLE `scheduled_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text,
	`type` text NOT NULL,
	`days_before` integer,
	`trigger_date` text NOT NULL,
	`os_notification_id` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`payment_method_type` text NOT NULL,
	`card_id` text,
	`date` text NOT NULL,
	`note` text,
	`attachment_uri` text,
	`beneficiary_name` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `transactions_date_idx` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_card_idx` ON `transactions` (`card_id`);