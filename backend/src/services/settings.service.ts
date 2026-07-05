import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { appSettings, categories, incomeSources, paymentMethods } from '../db/schema';
import { badRequest, conflict } from '../lib/errors';
import { nowIso } from '../lib/date';
import { config } from '../config';

const SETTINGS_ID = 1;

function ensureRow() {
  const row = db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID)).get();
  if (row) return row;
  const inserted = db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, currencyCode: config.defaultCurrencyCode })
    .returning().get();
  return inserted;
}

export function getSettings() {
  return ensureRow();
}

/** Cached in-process for dashboard aggregation calls that don't need a fresh read each time. */
export function getTopExpensesCount(): number {
  return ensureRow().topExpensesCount;
}

export interface UpdateSettingsInput {
  currencyCode?: string;
  topExpensesCount?: number;
  backupReminderThresholdDays?: number;
}

export function updateSettings(input: UpdateSettingsInput) {
  const current = ensureRow();
  if (input.topExpensesCount !== undefined && (input.topExpensesCount < 1 || input.topExpensesCount > 50)) {
    throw badRequest('topExpensesCount must be between 1 and 50', [
      { field: 'topExpensesCount', message: 'must be between 1 and 50' },
    ]);
  }
  if (
    input.backupReminderThresholdDays !== undefined &&
    (input.backupReminderThresholdDays < 1 || input.backupReminderThresholdDays > 3650)
  ) {
    throw badRequest('backupReminderThresholdDays must be between 1 and 3650', [
      { field: 'backupReminderThresholdDays', message: 'must be between 1 and 3650' },
    ]);
  }
  if (Object.keys(input).length === 0) return current;
  const row = db
    .update(appSettings)
    .set(input)
    .where(eq(appSettings.id, SETTINGS_ID))
    .returning().get();
  return row;
}

const SEED_CATEGORIES = ['Food', 'Transport', 'Rent', 'Utilities', 'Entertainment'];
const SEED_INCOME_SOURCES = ['Salary', 'Freelance', 'Gift'];
const SEED_PAYMENT_METHODS: { name: string; type: 'cash' | 'credit' | 'bank_transfer' }[] = [
  { name: 'Cash', type: 'cash' },
  { name: 'Credit Card', type: 'credit' },
  { name: 'Bank Transfer', type: 'bank_transfer' },
];

/** Seeds default taxonomy (PRD §5.2) — only runs once, guarded by firstRunCompletedAt. */
export function completeFirstRun(currencyCode: string) {
  const row = ensureRow();
  if (row.firstRunCompletedAt) {
    throw conflict('First-run setup has already been completed');
  }
  const now = nowIso();
  SEED_CATEGORIES.forEach((name, i) => {
    db.insert(categories).values({ name, sortOrder: i, createdAt: now, updatedAt: now }).run();
  });
  SEED_INCOME_SOURCES.forEach((name, i) => {
    db.insert(incomeSources).values({ name, sortOrder: i, createdAt: now, updatedAt: now }).run();
  });
  SEED_PAYMENT_METHODS.forEach(({ name, type }, i) => {
    db.insert(paymentMethods).values({ name, type, sortOrder: i, createdAt: now, updatedAt: now }).run();
  });
  const updated = db
    .update(appSettings)
    .set({ currencyCode, firstRunCompletedAt: now })
    .where(eq(appSettings.id, SETTINGS_ID))
    .returning().get();
  return updated;
}
