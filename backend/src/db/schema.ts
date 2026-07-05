import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core';

const nowIso = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    color: text('color'),
    icon: text('icon'),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    nameActiveIdx: index('ix_categories_name_active').on(table.name, table.archived),
  }),
);

export const incomeSources = sqliteTable(
  'income_sources',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    color: text('color'),
    icon: text('icon'),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    nameActiveIdx: index('ix_income_sources_name_active').on(table.name, table.archived),
  }),
);

export const paymentMethods = sqliteTable(
  'payment_methods',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type', { enum: ['cash', 'credit', 'debit', 'bank_transfer', 'other'] }),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    nameActiveIdx: index('ix_payment_methods_name_active').on(table.name, table.archived),
  }),
);

export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    color: text('color'),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    nameActiveIdx: index('ix_tags_name_active').on(table.name, table.archived),
  }),
);

export const recurringRules = sqliteTable(
  'recurring_rules',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type', { enum: ['expense', 'income'] }).notNull(),
    amountCents: integer('amount_cents').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    incomeSourceId: integer('income_source_id').references(() => incomeSources.id),
    paymentMethodId: integer('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id),
    frequency: text('frequency', { enum: ['weekly', 'monthly', 'yearly'] }).notNull(),
    startDate: text('start_date').notNull(),
    endDate: text('end_date'),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    typeExclusivity: check(
      'ck_recurring_rules_type_exclusivity',
      sql`(${table.type} = 'expense' AND ${table.categoryId} IS NOT NULL AND ${table.incomeSourceId} IS NULL)
          OR (${table.type} = 'income' AND ${table.incomeSourceId} IS NOT NULL AND ${table.categoryId} IS NULL)`,
    ),
    positiveAmount: check('ck_recurring_rules_amount_positive', sql`${table.amountCents} > 0`),
    frequencyValue: check('ck_recurring_rules_frequency', sql`${table.frequency} IN ('weekly', 'monthly', 'yearly')`),
  }),
);

export const transactions = sqliteTable(
  'transactions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    type: text('type', { enum: ['expense', 'income'] }).notNull(),
    date: text('date').notNull(),
    amountCents: integer('amount_cents').notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    incomeSourceId: integer('income_source_id').references(() => incomeSources.id),
    paymentMethodId: integer('payment_method_id')
      .notNull()
      .references(() => paymentMethods.id),
    note: text('note'),
    recurringRuleId: integer('recurring_rule_id').references(() => recurringRules.id),
    occurrenceDate: text('occurrence_date'),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    dateIdx: index('ix_transactions_date').on(table.date),
    categoryIdx: index('ix_transactions_category').on(table.categoryId),
    incomeSourceIdx: index('ix_transactions_income_source').on(table.incomeSourceId),
    paymentMethodIdx: index('ix_transactions_payment_method').on(table.paymentMethodId),
    ruleOccurrenceUnique: uniqueIndex('ux_transactions_rule_occurrence').on(
      table.recurringRuleId,
      table.occurrenceDate,
    ),
    typeExclusivity: check(
      'ck_transactions_type_exclusivity',
      sql`(${table.type} = 'expense' AND ${table.categoryId} IS NOT NULL AND ${table.incomeSourceId} IS NULL)
          OR (${table.type} = 'income' AND ${table.incomeSourceId} IS NOT NULL AND ${table.categoryId} IS NULL)`,
    ),
    positiveAmount: check('ck_transactions_amount_positive', sql`${table.amountCents} > 0`),
    recurringPairing: check(
      'ck_transactions_recurring_pairing',
      sql`(${table.recurringRuleId} IS NULL AND ${table.occurrenceDate} IS NULL)
          OR (${table.recurringRuleId} IS NOT NULL AND ${table.occurrenceDate} IS NOT NULL)`,
    ),
  }),
);

export const transactionTags = sqliteTable(
  'transaction_tags',
  {
    transactionId: integer('transaction_id')
      .notNull()
      .references(() => transactions.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => ({
    pk: uniqueIndex('ux_transaction_tags_pk').on(table.transactionId, table.tagId),
  }),
);

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),
  transactionId: integer('transaction_id')
    .notNull()
    .unique()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: text('created_at').notNull().default(nowIso),
});

export const wishListItems = sqliteTable(
  'wish_list_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    name: text('name').notNull(),
    estimatedCostCents: integer('estimated_cost_cents').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    priority: text('priority', { enum: ['high', 'medium', 'low'] }),
    note: text('note'),
    status: text('status', { enum: ['planned', 'purchased', 'abandoned'] })
      .notNull()
      .default('planned'),
    linkedTransactionId: integer('linked_transaction_id')
      .unique()
      .references(() => transactions.id, { onDelete: 'set null' }),
    createdAt: text('created_at').notNull().default(nowIso),
    updatedAt: text('updated_at').notNull().default(nowIso),
  },
  (table) => ({
    monthYearIdx: index('ix_wish_list_items_month_year').on(table.year, table.month),
    monthRange: check('ck_wish_list_items_month_range', sql`${table.month} BETWEEN 1 AND 12`),
    positiveEstimatedCost: check('ck_wish_list_items_estimated_cost_positive', sql`${table.estimatedCostCents} > 0`),
    statusValue: check('ck_wish_list_items_status', sql`${table.status} IN ('planned', 'purchased', 'abandoned')`),
  }),
);

export const appSettings = sqliteTable(
  'app_settings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    currencyCode: text('currency_code').notNull().default('USD'),
    topExpensesCount: integer('top_expenses_count').notNull().default(5),
    backupReminderThresholdDays: integer('backup_reminder_threshold_days').notNull().default(30),
    lastExportAt: text('last_export_at'),
    firstRunCompletedAt: text('first_run_completed_at'),
  },
  (table) => ({
    topExpensesRange: check('ck_app_settings_top_expenses_count_range', sql`${table.topExpensesCount} BETWEEN 1 AND 50`),
    backupReminderRange: check(
      'ck_app_settings_backup_reminder_threshold_days_range',
      sql`${table.backupReminderThresholdDays} BETWEEN 1 AND 3650`,
    ),
  }),
);
