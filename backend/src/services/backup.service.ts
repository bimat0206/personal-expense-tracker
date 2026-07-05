import { eq, asc } from 'drizzle-orm';
import { db } from '../db/db';
import {
  categories,
  incomeSources,
  paymentMethods,
  tags,
  transactions,
  transactionTags,
  attachments,
  wishListItems,
  recurringRules,
  appSettings,
} from '../db/schema';
import path from 'path';
import { badRequest } from '../lib/errors';
import { isValidDateString, nowIso } from '../lib/date';
import { isValidAmountCents } from '../lib/currency';
import { getSettings } from './settings.service';
import { config } from '../config';

const SCHEMA_VERSION = 1;

export function exportData() {
  const data = {
    schemaVersion: SCHEMA_VERSION,
    categories: db.select().from(categories).all(),
    incomeSources: db.select().from(incomeSources).all(),
    paymentMethods: db.select().from(paymentMethods).all(),
    tags: db.select().from(tags).all(),
    transactions: db.select().from(transactions).all(),
    transactionTags: db.select().from(transactionTags).all(),
    attachments: db.select().from(attachments).all(),
    wishListItems: db.select().from(wishListItems).all(),
    recurringRules: db.select().from(recurringRules).all(),
    appSettings: getSettings(),
  };
  db.update(appSettings).set({ lastExportAt: nowIso() }).where(eq(appSettings.id, 1)).run();
  return data;
}

interface ExportPayload {
  schemaVersion: number;
  categories?: { id: number }[];
  incomeSources?: { id: number }[];
  paymentMethods?: { id: number }[];
  tags?: { id: number }[];
  transactions?: Array<Record<string, unknown> & { id: number; categoryId?: number | null; incomeSourceId?: number | null; paymentMethodId: number }>;
  transactionTags?: Array<{ transactionId: number; tagId: number }>;
  attachments?: Array<Record<string, unknown> & { id: string; transactionId: number }>;
  wishListItems?: Array<Record<string, unknown> & { id: number; categoryId: number; linkedTransactionId?: number | null }>;
  recurringRules?: Array<Record<string, unknown> & { id: number; categoryId?: number | null; incomeSourceId?: number | null; paymentMethodId: number }>;
  appSettings?: Record<string, unknown>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertEnum(value: unknown, allowed: readonly string[], field: string): asserts value is string {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw badRequest(`Import invalid: ${field} has an unsupported value`);
  }
}

function assertDate(value: unknown, field: string): void {
  if (!isValidDateString(value)) {
    throw badRequest(`Import invalid: ${field} must be a valid YYYY-MM-DD date`);
  }
}

function assertPositiveAmount(value: unknown, field: string): void {
  if (!isValidAmountCents(value)) {
    throw badRequest(`Import invalid: ${field} must be a positive integer`);
  }
}

function assertIntegerRange(value: unknown, field: string, min: number, max: number): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw badRequest(`Import invalid: ${field} must be between ${min} and ${max}`);
  }
}

function assertOptionalBoolean(value: unknown, field: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw badRequest(`Import invalid: ${field} must be boolean`);
  }
}

function assertWithinAttachmentsDir(filePath: unknown, id: string): void {
  if (typeof filePath !== 'string') {
    throw badRequest(`Import invalid: attachment ${id} filePath must be a string`);
  }
  const resolved = path.resolve(filePath);
  const dir = path.resolve(config.attachmentsPath);
  if (resolved !== dir && !resolved.startsWith(dir + path.sep)) {
    throw badRequest(`Import invalid: attachment ${id} filePath is outside the attachments directory`);
  }
}

function validateRows(payload: ExportPayload): void {
  for (const t of payload.transactions ?? []) {
    assertEnum(t.type, ['expense', 'income'], `transaction ${t.id} type`);
    assertDate(t.date, `transaction ${t.id} date`);
    assertPositiveAmount(t.amountCents, `transaction ${t.id} amountCents`);
    const hasCategory = t.categoryId != null;
    const hasIncomeSource = t.incomeSourceId != null;
    if ((t.type === 'expense' && (!hasCategory || hasIncomeSource)) || (t.type === 'income' && (!hasIncomeSource || hasCategory))) {
      throw badRequest(`Import invalid: transaction ${t.id} type does not match category/income source fields`);
    }
    if ((t.recurringRuleId == null) !== (t.occurrenceDate == null)) {
      throw badRequest(`Import invalid: transaction ${t.id} recurring fields must be paired`);
    }
    if (t.occurrenceDate != null) assertDate(t.occurrenceDate, `transaction ${t.id} occurrenceDate`);
  }

  for (const a of payload.attachments ?? []) {
    if (!isObject(a)) throw badRequest('Import invalid: attachment rows must be objects');
    if (typeof a.id !== 'string' || a.id.length === 0) throw badRequest('Import invalid: attachment id is required');
    if (typeof a.fileName !== 'string' || a.fileName.length === 0) throw badRequest(`Import invalid: attachment ${a.id} fileName is required`);
    assertWithinAttachmentsDir(a.filePath, a.id);
    if (typeof a.mimeType !== 'string' || !config.attachmentAllowedMimeTypes.includes(a.mimeType)) {
      throw badRequest(`Import invalid: attachment ${a.id} mimeType is unsupported`);
    }
    assertIntegerRange(a.sizeBytes, `attachment ${a.id} sizeBytes`, 0, config.attachmentMaxSizeBytes);
  }

  for (const w of payload.wishListItems ?? []) {
    assertIntegerRange(w.month, `wish list item ${w.id} month`, 1, 12);
    assertIntegerRange(w.year, `wish list item ${w.id} year`, 1900, 9999);
    assertPositiveAmount(w.estimatedCostCents, `wish list item ${w.id} estimatedCostCents`);
    if (w.priority != null) assertEnum(w.priority, ['high', 'medium', 'low'], `wish list item ${w.id} priority`);
    assertEnum(w.status, ['planned', 'purchased', 'abandoned'], `wish list item ${w.id} status`);
  }

  for (const r of payload.recurringRules ?? []) {
    assertEnum(r.type, ['expense', 'income'], `recurring rule ${r.id} type`);
    assertPositiveAmount(r.amountCents, `recurring rule ${r.id} amountCents`);
    assertEnum(r.frequency, ['weekly', 'monthly', 'yearly'], `recurring rule ${r.id} frequency`);
    assertDate(r.startDate, `recurring rule ${r.id} startDate`);
    if (r.endDate != null) {
      assertDate(r.endDate, `recurring rule ${r.id} endDate`);
      if (typeof r.endDate === 'string' && typeof r.startDate === 'string' && r.endDate < r.startDate) {
        throw badRequest(`Import invalid: recurring rule ${r.id} endDate cannot be before startDate`);
      }
    }
    assertOptionalBoolean(r.active, `recurring rule ${r.id} active`);
    const hasCategory = r.categoryId != null;
    const hasIncomeSource = r.incomeSourceId != null;
    if ((r.type === 'expense' && (!hasCategory || hasIncomeSource)) || (r.type === 'income' && (!hasIncomeSource || hasCategory))) {
      throw badRequest(`Import invalid: recurring rule ${r.id} type does not match category/income source fields`);
    }
  }

  if (payload.appSettings) {
    const topExpensesCount = payload.appSettings.topExpensesCount;
    if (topExpensesCount !== undefined) assertIntegerRange(topExpensesCount, 'appSettings.topExpensesCount', 1, 50);
    const backupReminderThresholdDays = payload.appSettings.backupReminderThresholdDays;
    if (backupReminderThresholdDays !== undefined) {
      assertIntegerRange(backupReminderThresholdDays, 'appSettings.backupReminderThresholdDays', 1, 3650);
    }
  }
}

function validateReferences(payload: ExportPayload): void {
  const ids = (rows?: { id: number | string }[]) => new Set((rows ?? []).map((r) => r.id));
  const categoryIds = ids(payload.categories);
  const incomeSourceIds = ids(payload.incomeSources);
  const paymentMethodIds = ids(payload.paymentMethods);
  const tagIds = ids(payload.tags);
  const transactionIds = ids(payload.transactions);

  for (const t of payload.transactions ?? []) {
    if (t.categoryId != null && !categoryIds.has(t.categoryId)) {
      throw badRequest(`Import invalid: transaction ${t.id} references missing category ${t.categoryId}`);
    }
    if (t.incomeSourceId != null && !incomeSourceIds.has(t.incomeSourceId)) {
      throw badRequest(`Import invalid: transaction ${t.id} references missing income source ${t.incomeSourceId}`);
    }
    if (!paymentMethodIds.has(t.paymentMethodId)) {
      throw badRequest(`Import invalid: transaction ${t.id} references missing payment method ${t.paymentMethodId}`);
    }
  }
  for (const tt of payload.transactionTags ?? []) {
    if (!transactionIds.has(tt.transactionId) || !tagIds.has(tt.tagId)) {
      throw badRequest('Import invalid: a transaction_tag row references a missing transaction or tag');
    }
  }
  for (const a of payload.attachments ?? []) {
    if (!transactionIds.has(a.transactionId)) {
      throw badRequest(`Import invalid: attachment ${a.id} references missing transaction ${a.transactionId}`);
    }
  }
  for (const w of payload.wishListItems ?? []) {
    if (!categoryIds.has(w.categoryId)) {
      throw badRequest(`Import invalid: wish list item ${w.id} references missing category ${w.categoryId}`);
    }
    if (w.linkedTransactionId != null && !transactionIds.has(w.linkedTransactionId)) {
      throw badRequest(`Import invalid: wish list item ${w.id} references missing transaction ${w.linkedTransactionId}`);
    }
  }
  for (const r of payload.recurringRules ?? []) {
    if (r.categoryId != null && !categoryIds.has(r.categoryId)) {
      throw badRequest(`Import invalid: recurring rule ${r.id} references missing category ${r.categoryId}`);
    }
    if (r.incomeSourceId != null && !incomeSourceIds.has(r.incomeSourceId)) {
      throw badRequest(`Import invalid: recurring rule ${r.id} references missing income source ${r.incomeSourceId}`);
    }
    if (!paymentMethodIds.has(r.paymentMethodId)) {
      throw badRequest(`Import invalid: recurring rule ${r.id} references missing payment method ${r.paymentMethodId}`);
    }
  }
}

/**
 * Full-replace import. Requires explicit confirmation (PRD §8). Active-name uniqueness is only
 * enforced interactively (Config Service) — not here — so a valid export's rows are accepted as-is
 * even if they'd look like "duplicates" (SYSTEM_DESIGN.md §6/§7).
 */
export function importData(payload: ExportPayload, confirm: boolean) {
  if (!confirm) {
    throw badRequest('confirm must be true — this operation replaces all existing data');
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    throw badRequest(`Unsupported schemaVersion ${payload.schemaVersion} (expected ${SCHEMA_VERSION})`);
  }
  validateReferences(payload);
  validateRows(payload);

  const counts: Record<string, number> = {};
  db.transaction((tx) => {
    tx.delete(transactionTags).run();
    tx.delete(attachments).run();
    tx.delete(transactions).run();
    tx.delete(wishListItems).run();
    tx.delete(recurringRules).run();
    tx.delete(categories).run();
    tx.delete(incomeSources).run();
    tx.delete(paymentMethods).run();
    tx.delete(tags).run();
    tx.delete(appSettings).run();

    // Heterogeneous Drizzle tables, all valid insert targets at runtime — see config.service.ts for the same pattern.
    const insertAll = (table: any, rows: Record<string, unknown>[] | undefined, key: string) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      counts[key] = rows?.length ?? 0;
      if (rows?.length) tx.insert(table).values(rows).run();
    };
    insertAll(categories, payload.categories, 'categories');
    insertAll(incomeSources, payload.incomeSources, 'incomeSources');
    insertAll(paymentMethods, payload.paymentMethods, 'paymentMethods');
    insertAll(tags, payload.tags, 'tags');
    insertAll(recurringRules, payload.recurringRules, 'recurringRules');
    insertAll(transactions, payload.transactions, 'transactions');
    insertAll(transactionTags, payload.transactionTags, 'transactionTags');
    insertAll(attachments, payload.attachments, 'attachments');
    insertAll(wishListItems, payload.wishListItems, 'wishListItems');
    if (payload.appSettings) {
      tx.insert(appSettings).values({ id: 1, ...payload.appSettings }).run();
      counts.appSettings = 1;
    }
  });
  return { imported: counts };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Derived, not stored (SYSTEM_DESIGN.md §6): baseline is the first transaction ever created if no export has happened yet. */
export function isBackupReminderDue(): boolean {
  const settings = getSettings();
  const thresholdMs = settings.backupReminderThresholdDays * DAY_MS;
  const baseline =
    settings.lastExportAt ??
    db.select().from(transactions).orderBy(asc(transactions.createdAt)).limit(1).get()?.createdAt;
  if (!baseline) return false;
  return Date.now() - new Date(baseline).getTime() > thresholdMs;
}
