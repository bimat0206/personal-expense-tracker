import { and, eq, ne } from 'drizzle-orm';
import { db } from '../db/db';
import { wishListItems } from '../db/schema';
import { badRequest, conflict, notFound } from '../lib/errors';
import { today, nowIso } from '../lib/date';
import { isValidAmountCents } from '../lib/currency';
import { createWithHandle } from './transaction.service';

export interface CreateWishListItemInput {
  month: number;
  year: number;
  name: string;
  estimatedCostCents: number;
  categoryId: number;
  priority?: 'high' | 'medium' | 'low';
  note?: string;
}

function validateCreateInput(input: CreateWishListItemInput): void {
  if (input.month < 1 || input.month > 12) {
    throw badRequest('month must be between 1 and 12', [{ field: 'month', message: 'out of range' }]);
  }
  if (!isValidAmountCents(input.estimatedCostCents)) {
    throw badRequest('estimatedCostCents must be a positive integer', [
      { field: 'estimatedCostCents', message: 'must be a positive integer' },
    ]);
  }
  if (!input.name?.trim()) {
    throw badRequest('name is required', [{ field: 'name', message: 'required' }]);
  }
}

export function listForMonth(year: number, month: number) {
  const items = db
    .select()
    .from(wishListItems)
    .where(and(eq(wishListItems.year, year), eq(wishListItems.month, month)))
    .all();
  const estimatedTotalCents = items
    .filter((i) => i.status !== 'abandoned')
    .reduce((sum, i) => sum + i.estimatedCostCents, 0);
  return { items, estimatedTotalCents };
}

export function create(input: CreateWishListItemInput) {
  validateCreateInput(input);
  const now = nowIso();
  const row = db
    .insert(wishListItems)
    .values({
      month: input.month,
      year: input.year,
      name: input.name,
      estimatedCostCents: input.estimatedCostCents,
      categoryId: input.categoryId,
      priority: input.priority ?? null,
      note: input.note ?? null,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    })
    .returning().get();
  return row;
}

function getOrThrow(id: number) {
  const row = db.select().from(wishListItems).where(eq(wishListItems.id, id)).get();
  if (!row) throw notFound();
  return row;
}

export interface UpdateWishListItemInput {
  name?: string;
  estimatedCostCents?: number;
  categoryId?: number;
  priority?: 'high' | 'medium' | 'low';
  note?: string;
  status?: 'planned' | 'abandoned';
}

/** Status transitions: planned⇄abandoned via this endpoint; planned→purchased only via /purchase (PRD §5.4). */
export function update(id: number, input: UpdateWishListItemInput) {
  const existing = getOrThrow(id);
  if (input.status && input.status !== existing.status) {
    const allowed = new Set(['planned', 'abandoned']);
    if (!allowed.has(existing.status) || !allowed.has(input.status)) {
      throw conflict(`Cannot transition from "${existing.status}" to "${input.status}"`);
    }
  }
  const row = db
    .update(wishListItems)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(wishListItems.id, id))
    .returning().get();
  return row;
}

export function remove(id: number): void {
  getOrThrow(id);
  db.delete(wishListItems).where(eq(wishListItems.id, id)).run();
}

export interface PurchaseInput {
  amountCents?: number;
  date?: string;
  paymentMethodId: number;
}

/** Atomic purchase conversion: creates the Transaction and updates the item in one DB transaction (SYSTEM_DESIGN.md §6/§9). */
export function purchase(id: number, input: PurchaseInput) {
  const existing = getOrThrow(id);
  if (existing.status !== 'planned') {
    throw conflict(`Item is "${existing.status}", not "planned" — cannot purchase again`);
  }
  if (!input.paymentMethodId) {
    throw badRequest('paymentMethodId is required', [{ field: 'paymentMethodId', message: 'required' }]);
  }
  return db.transaction((tx) => {
    const transaction = createWithHandle(tx, {
      type: 'expense',
      date: input.date ?? today(),
      amountCents: input.amountCents ?? existing.estimatedCostCents,
      categoryId: existing.categoryId,
      paymentMethodId: input.paymentMethodId,
    });
    const wishListItem = tx
      .update(wishListItems)
      .set({ status: 'purchased', linkedTransactionId: transaction.id, updatedAt: nowIso() })
      .where(eq(wishListItems.id, id))
      .returning().get();
    return { wishListItem, transaction };
  });
}

export function copyToNextMonth(id: number) {
  const existing = getOrThrow(id);
  const month = existing.month === 12 ? 1 : existing.month + 1;
  const year = existing.month === 12 ? existing.year + 1 : existing.year;
  return create({
    month,
    year,
    name: existing.name,
    estimatedCostCents: existing.estimatedCostCents,
    categoryId: existing.categoryId,
    priority: existing.priority ?? undefined,
    note: existing.note ?? undefined,
  });
}
