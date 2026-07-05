CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`currency_code` text DEFAULT 'USD' NOT NULL,
	`top_expenses_count` integer DEFAULT 5 NOT NULL,
	`backup_reminder_threshold_days` integer DEFAULT 30 NOT NULL,
	`last_export_at` text,
	`first_run_completed_at` text,
	CONSTRAINT `ck_app_settings_top_expenses_count_range` CHECK(`top_expenses_count` BETWEEN 1 AND 50),
	CONSTRAINT `ck_app_settings_backup_reminder_threshold_days_range` CHECK(`backup_reminder_threshold_days` BETWEEN 1 AND 3650)
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon` text,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `income_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon` text,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurring_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category_id` integer,
	`income_source_id` integer,
	`payment_method_id` integer NOT NULL,
	`frequency` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`income_source_id`) REFERENCES `income_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `ck_recurring_rules_type_exclusivity` CHECK((`type` = 'expense' AND `category_id` IS NOT NULL AND `income_source_id` IS NULL) OR (`type` = 'income' AND `income_source_id` IS NOT NULL AND `category_id` IS NULL)),
	CONSTRAINT `ck_recurring_rules_amount_positive` CHECK(`amount_cents` > 0),
	CONSTRAINT `ck_recurring_rules_frequency` CHECK(`frequency` IN ('weekly', 'monthly', 'yearly'))
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`archived` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transaction_tags` (
	`transaction_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`category_id` integer,
	`income_source_id` integer,
	`payment_method_id` integer NOT NULL,
	`note` text,
	`recurring_rule_id` integer,
	`occurrence_date` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`income_source_id`) REFERENCES `income_sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurring_rule_id`) REFERENCES `recurring_rules`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT `ck_transactions_type_exclusivity` CHECK((`type` = 'expense' AND `category_id` IS NOT NULL AND `income_source_id` IS NULL) OR (`type` = 'income' AND `income_source_id` IS NOT NULL AND `category_id` IS NULL)),
	CONSTRAINT `ck_transactions_amount_positive` CHECK(`amount_cents` > 0),
	CONSTRAINT `ck_transactions_recurring_pairing` CHECK((`recurring_rule_id` IS NULL AND `occurrence_date` IS NULL) OR (`recurring_rule_id` IS NOT NULL AND `occurrence_date` IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `wish_list_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`name` text NOT NULL,
	`estimated_cost_cents` integer NOT NULL,
	`category_id` integer NOT NULL,
	`priority` text,
	`note` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`linked_transaction_id` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT `ck_wish_list_items_month_range` CHECK(`month` BETWEEN 1 AND 12),
	CONSTRAINT `ck_wish_list_items_estimated_cost_positive` CHECK(`estimated_cost_cents` > 0),
	CONSTRAINT `ck_wish_list_items_status` CHECK(`status` IN ('planned', 'purchased', 'abandoned'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `attachments_transaction_id_unique` ON `attachments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `ix_categories_name_active` ON `categories` (`name`,`archived`);--> statement-breakpoint
CREATE INDEX `ix_income_sources_name_active` ON `income_sources` (`name`,`archived`);--> statement-breakpoint
CREATE INDEX `ix_payment_methods_name_active` ON `payment_methods` (`name`,`archived`);--> statement-breakpoint
CREATE INDEX `ix_tags_name_active` ON `tags` (`name`,`archived`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_transaction_tags_pk` ON `transaction_tags` (`transaction_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `ix_transactions_date` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `ix_transactions_category` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `ix_transactions_income_source` ON `transactions` (`income_source_id`);--> statement-breakpoint
CREATE INDEX `ix_transactions_payment_method` ON `transactions` (`payment_method_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ux_transactions_rule_occurrence` ON `transactions` (`recurring_rule_id`,`occurrence_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `wish_list_items_linked_transaction_id_unique` ON `wish_list_items` (`linked_transaction_id`);--> statement-breakpoint
CREATE INDEX `ix_wish_list_items_month_year` ON `wish_list_items` (`year`,`month`);
