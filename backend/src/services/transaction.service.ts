import { and, eq, gte, lte, inArray, desc, asc } from 'drizzle-orm';
import { db } from '../db/db';
import {
  transactions,
  transactionTags,
  tags,
  attachments,
  wishListItems,
  categories,
  incomeSources,
  paymentMethods,
} from '../db/schema';
import { badRequest, notFound } from '../lib/errors';
import { isFutureDate, isValidDateString, nowIso } from '../lib/date';
import { isValidAmountCents } from '../lib/currency';

type DbOrTx = typeof db;

export interface CreateTransactionInput {
  type: 'expense' | 'income';
  date: string;
  amountCents: number;
  categoryId?: number | null;
  incomeSourceId?: number | null;
  paymentMethodId: number;
  note?: string | null;
  tagIds?: number[];
  recurringRuleId?: number | null;
  occurrenceDate?: string | null;
}

export interface ListFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  categoryId?: number;
  incomeSourceId?: number;
  paymentMethodId?: number;
  tagId?: number;
  page: number;
  pageSize: number;
}

export function validateCreateInput(input: CreateTransactionInput): void {
  if (!isValidDateString(input.date)) {
    throw badRequest('Invalid date', [{ field: 'date', message: 'must be a valid YYYY-MM-DD date' }]);
  }
  if (!input.recurringRuleId && isFutureDate(input.date)) {
    throw badRequest('Future-dated transactions are not allowed; use the Wish List instead', [
      { field: 'date', message: 'cannot be in the future' },
    ]);
  }
  if (!isValidAmountCents(input.amountCents)) {
    throw badRequest('amountCents must be a positive integer', [
      { field: 'amountCents', message: 'must be a positive integer' },
    ]);
  }
  if (input.note && input.note.length > 500) {
    throw badRequest('note must be 500 characters or fewer', [{ field: 'note', message: 'too long' }]);
  }
  if (input.type === 'expense') {
    if (!input.categoryId) {
      throw badRequest('categoryId is required for expense transactions', [
        { field: 'categoryId', message: 'required for expense' },
      ]);
    }
    if (input.incomeSourceId) {
      throw badRequest('incomeSourceId must not be set for expense transactions', [
        { field: 'incomeSourceId', message: 'must be empty for expense' },
      ]);
    }
  } else {
    if (!input.incomeSourceId) {
      throw badRequest('incomeSourceId is required for income transactions', [
        { field: 'incomeSourceId', message: 'required for income' },
      ]);
    }
    if (input.categoryId) {
      throw badRequest('categoryId must not be set for income transactions', [
        { field: 'categoryId', message: 'must be empty for income' },
      ]);
    }
  }
}

function assertActiveReference(
  table: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  id: number,
  field: string,
): void {
  const row = db.select().from(table).where(eq(table.id, id)).get();
  if (!row) throw badRequest(`${field} does not exist`, [{ field, message: 'not found' }]);
  if (row.archived) throw badRequest(`${field} is archived`, [{ field, message: 'must reference an active item' }]);
}

function validateActiveReferences(input: CreateTransactionInput): void {
  assertActiveReference(paymentMethods, input.paymentMethodId, 'paymentMethodId');
  if (input.categoryId != null) assertActiveReference(categories, input.categoryId, 'categoryId');
  if (input.incomeSourceId != null) assertActiveReference(incomeSources, input.incomeSourceId, 'incomeSourceId');
  for (const tagId of input.tagIds ?? []) {
    assertActiveReference(tags, tagId, 'tagIds');
  }
}

function toRow(handle: DbOrTx, id: number) {
  const row = handle.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!row) throw notFound();
  const tagRows = handle
    .select({ id: tags.id, name: tags.name, color: tags.color, sortOrder: tags.sortOrder, archived: tags.archived, createdAt: tags.createdAt })
    .from(transactionTags)
    .innerJoin(tags, eq(transactionTags.tagId, tags.id))
    .where(eq(transactionTags.transactionId, id))
    .all();
  const attachment = handle.select().from(attachments).where(eq(attachments.transactionId, id)).get();
  return { ...row, tags: tagRows, attachmentId: attachment?.id ?? null };
}

/** Creates a transaction using the given handle — pass a transaction handle for cross-service atomicity (SYSTEM_DESIGN.md §6 Wish List Service unit of work). */
export function createWithHandle(handle: DbOrTx, input: CreateTransactionInput) {
  validateCreateInput(input);
  validateActiveReferences(input);
  const now = nowIso();
  const row = handle
    .insert(transactions)
    .values({
      type: input.type,
      date: input.date,
      amountCents: input.amountCents,
      categoryId: input.categoryId ?? null,
      incomeSourceId: input.incomeSourceId ?? null,
      paymentMethodId: input.paymentMethodId,
      note: input.note ?? null,
      recurringRuleId: input.recurringRuleId ?? null,
      occurrenceDate: input.occurrenceDate ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning().get();
  if (input.tagIds?.length) {
    handle
      .insert(transactionTags)
      .values(input.tagIds.map((tagId) => ({ transactionId: row.id, tagId })))
      .run();
  }
  return toRow(handle, row.id);
}

export function create(input: CreateTransactionInput) {
  return db.transaction((tx) => createWithHandle(tx, input));
}

export function getById(id: number) {
  return toRow(db, id);
}

export function list(filters: ListFilters) {
  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(transactions.date, filters.dateFrom));
  if (filters.dateTo) conditions.push(lte(transactions.date, filters.dateTo));
  if (filters.type) conditions.push(eq(transactions.type, filters.type as 'expense' | 'income'));
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
  if (filters.incomeSourceId) conditions.push(eq(transactions.incomeSourceId, filters.incomeSourceId));
  if (filters.paymentMethodId) conditions.push(eq(transactions.paymentMethodId, filters.paymentMethodId));

  let ids: number[] | null = null;
  if (filters.tagId) {
    ids = db
      .select({ id: transactionTags.transactionId })
      .from(transactionTags)
      .where(eq(transactionTags.tagId, filters.tagId))
      .all()
      .map((r) => r.id);
    conditions.push(inArray(transactions.id, ids.length ? ids : [-1]));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const all = db.select().from(transactions).where(where).orderBy(desc(transactions.date), desc(transactions.id)).all();
  const total = all.length;
  const start = (filters.page - 1) * filters.pageSize;
  const page = all.slice(start, start + filters.pageSize);
  return { items: page.map((row) => toRow(db, row.id)), total };
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {}

export function update(id: number, input: UpdateTransactionInput) {
  const existing = db.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!existing) throw notFound();
  const merged: CreateTransactionInput = {
    type: input.type ?? (existing.type as 'expense' | 'income'),
    date: input.date ?? existing.date,
    amountCents: input.amountCents ?? existing.amountCents,
    categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
    incomeSourceId: input.incomeSourceId !== undefined ? input.incomeSourceId : existing.incomeSourceId,
    paymentMethodId: input.paymentMethodId ?? existing.paymentMethodId,
    note: input.note !== undefined ? input.note : existing.note,
    tagIds: input.tagIds,
  };
  validateCreateInput(merged);
  return db.transaction((tx) => {
    tx.update(transactions)
      .set({
        type: merged.type,
        date: merged.date,
        amountCents: merged.amountCents,
        categoryId: merged.categoryId ?? null,
        incomeSourceId: merged.incomeSourceId ?? null,
        paymentMethodId: merged.paymentMethodId,
        note: merged.note ?? null,
        updatedAt: nowIso(),
      })
      .where(eq(transactions.id, id))
      .run();
    if (input.tagIds) {
      tx.delete(transactionTags).where(eq(transactionTags.transactionId, id)).run();
      if (input.tagIds.length) {
        tx.insert(transactionTags)
          .values(input.tagIds.map((tagId) => ({ transactionId: id, tagId })))
          .run();
      }
    }
    return toRow(tx, id);
  });
}

/** Deletes the transaction; if linked from a Wish List item, reverts it to `planned` in the same DB transaction (SYSTEM_DESIGN.md §10). */
export function remove(id: number): void {
  const existing = db.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!existing) throw notFound();
  db.transaction((tx) => {
    const linked = tx.select().from(wishListItems).where(eq(wishListItems.linkedTransactionId, id)).get();
    tx.delete(transactions).where(eq(transactions.id, id)).run();
    if (linked) {
      tx.update(wishListItems)
        .set({ status: 'planned', linkedTransactionId: null, updatedAt: nowIso() })
        .where(eq(wishListItems.id, linked.id))
        .run();
    }
  });
}
