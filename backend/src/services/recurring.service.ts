import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { recurringRules, transactions } from '../db/schema';
import { badRequest, notFound } from '../lib/errors';
import { today, nowIso } from '../lib/date';
import { isValidAmountCents } from '../lib/currency';
import { computeOccurrences } from '../lib/occurrence';
import { createWithHandle } from './transaction.service';

export interface CreateRuleInput {
  type: 'expense' | 'income';
  amountCents: number;
  categoryId?: number | null;
  incomeSourceId?: number | null;
  paymentMethodId: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string | null;
}

function validate(input: CreateRuleInput): void {
  if (!isValidAmountCents(input.amountCents)) {
    throw badRequest('amountCents must be a positive integer', [{ field: 'amountCents', message: 'must be a positive integer' }]);
  }
  if (input.type === 'expense' && (!input.categoryId || input.incomeSourceId)) {
    throw badRequest('expense rules require categoryId and must not set incomeSourceId');
  }
  if (input.type === 'income' && (!input.incomeSourceId || input.categoryId)) {
    throw badRequest('income rules require incomeSourceId and must not set categoryId');
  }
  if (input.endDate && input.endDate < input.startDate) {
    throw badRequest('endDate cannot be before startDate', [{ field: 'endDate', message: 'before startDate' }]);
  }
}

export function list(includeStopped: boolean) {
  const rows = db.select().from(recurringRules).all();
  return includeStopped ? rows : rows.filter((r) => r.active);
}

export function create(input: CreateRuleInput) {
  validate(input);
  const now = nowIso();
  return db.transaction((tx) => {
    const row = tx
      .insert(recurringRules)
      .values({
        type: input.type,
        amountCents: input.amountCents,
        categoryId: input.categoryId ?? null,
        incomeSourceId: input.incomeSourceId ?? null,
        paymentMethodId: input.paymentMethodId,
        frequency: input.frequency,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        active: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning().get();

    for (const date of computeOccurrences(
      { frequency: row.frequency, startDate: row.startDate, endDate: row.endDate },
      today(),
    )) {
      createWithHandle(tx, {
        type: row.type,
        date,
        amountCents: row.amountCents,
        categoryId: row.categoryId,
        incomeSourceId: row.incomeSourceId,
        paymentMethodId: row.paymentMethodId,
        recurringRuleId: row.id,
        occurrenceDate: date,
      });
    }

    return row;
  });
}

function getOrThrow(id: number) {
  const row = db.select().from(recurringRules).where(eq(recurringRules.id, id)).get();
  if (!row) throw notFound();
  return row;
}

export function update(id: number, input: Partial<CreateRuleInput>) {
  const existing = getOrThrow(id);
  const merged = { ...existing, ...input };
  validate(merged);
  const row = db
    .update(recurringRules)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(recurringRules.id, id))
    .returning().get();
  return row;
}

export function stop(id: number) {
  getOrThrow(id);
  const row = db
    .update(recurringRules)
    .set({ active: false, updatedAt: nowIso() })
    .where(eq(recurringRules.id, id))
    .returning().get();
  return row;
}

export function resume(id: number) {
  getOrThrow(id);
  const row = db
    .update(recurringRules)
    .set({ active: true, updatedAt: nowIso() })
    .where(eq(recurringRules.id, id))
    .returning().get();
  return row;
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

/** Idempotent: skips occurrences already generated, backstopped by the DB unique constraint (SYSTEM_DESIGN.md §6). */
export function generate() {
  const rules = db.select().from(recurringRules).where(eq(recurringRules.active, true)).all();
  const upTo = today();
  const generated = [];

  for (const rule of rules) {
    const occurrenceDates = computeOccurrences(
      { frequency: rule.frequency, startDate: rule.startDate, endDate: rule.endDate },
      upTo,
    );
    const existingDates = new Set(
      db
        .select({ occurrenceDate: transactions.occurrenceDate })
        .from(transactions)
        .where(eq(transactions.recurringRuleId, rule.id))
        .all()
        .map((r) => r.occurrenceDate),
    );
    for (const date of occurrenceDates) {
      if (existingDates.has(date)) continue;
      try {
        const txn = db.transaction((tx) =>
          createWithHandle(tx, {
            type: rule.type,
            date,
            amountCents: rule.amountCents,
            categoryId: rule.categoryId,
            incomeSourceId: rule.incomeSourceId,
            paymentMethodId: rule.paymentMethodId,
            recurringRuleId: rule.id,
            occurrenceDate: date,
          }),
        );
        generated.push(txn);
      } catch (err) {
        if (isUniqueConstraintError(err)) continue;
        console.error(`Recurring rule ${rule.id} failed to generate occurrence ${date}:`, err);
      }
    }
  }
  return generated;
}
