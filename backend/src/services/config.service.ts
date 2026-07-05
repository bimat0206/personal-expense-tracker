import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import {
  categories,
  incomeSources,
  paymentMethods,
  tags,
  transactions,
  wishListItems,
  recurringRules,
  transactionTags,
} from '../db/schema';
import { conflict, notFound } from '../lib/errors';

interface ConfigRow {
  id: number;
  name: string;
  archived: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

interface UsageCheck {
  label: string;
  count: (id: number) => number;
}

interface ConfigServiceOptions {
  // Heterogeneous Drizzle tables (categories/incomeSources/paymentMethods/tags) share the same
  // runtime shape (id, name, archived, sortOrder, timestamps) but not a common Drizzle TS type.
  table: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  usageChecks: UsageCheck[];
}

export function createConfigService({ table, usageChecks }: ConfigServiceOptions) {
  function list(includeArchived: boolean): ConfigRow[] {
    const rows = db.select().from(table).orderBy(table.sortOrder).all() as ConfigRow[];
    return includeArchived ? rows : rows.filter((r) => !r.archived);
  }

  function assertNameAvailable(name: string, excludeId?: number): void {
    const rows = db.select().from(table).all() as ConfigRow[];
    const clash = rows.find(
      (r) => !r.archived && r.id !== excludeId && r.name.toLowerCase() === name.toLowerCase(),
    );
    if (clash) throw conflict(`"${name}" is already in use by an active item`);
  }

  function getOrThrow(id: number): ConfigRow {
    const row = db.select().from(table).where(eq(table.id, id)).get();
    if (!row) throw notFound();
    return row as ConfigRow;
  }

  function create(data: Record<string, unknown>): ConfigRow {
    assertNameAvailable(data.name as string);
    const now = new Date().toISOString();
    const row = db
      .insert(table)
      .values({ ...data, createdAt: now, updatedAt: now })
      .returning().get();
    return row;
  }

  function update(id: number, data: Record<string, unknown>): ConfigRow {
    getOrThrow(id);
    if (typeof data.name === 'string') assertNameAvailable(data.name, id);
    const row = db
      .update(table)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(table.id, id))
      .returning().get();
    return row;
  }

  function archive(id: number): ConfigRow {
    getOrThrow(id);
    const row = db
      .update(table)
      .set({ archived: true, updatedAt: new Date().toISOString() })
      .where(eq(table.id, id))
      .returning().get();
    return row;
  }

  function unarchive(id: number): ConfigRow {
    const existing = getOrThrow(id);
    assertNameAvailable(existing.name, id);
    const row = db
      .update(table)
      .set({ archived: false, updatedAt: new Date().toISOString() })
      .where(eq(table.id, id))
      .returning().get();
    return row;
  }

  function remove(id: number): void {
    getOrThrow(id);
    for (const check of usageChecks) {
      const count = check.count(id);
      if (count > 0) throw conflict(`Cannot delete: referenced by ${count} ${check.label}`);
    }
    db.delete(table).where(eq(table.id, id)).run();
  }

  return { list, create, update, archive, unarchive, remove, getOrThrow };
}

function countWhere(table: any, column: string, id: number): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  return db
    .select()
    .from(table)
    .where(eq(table[column], id))
    .all().length;
}

export const categoryService = createConfigService({
  table: categories,
  usageChecks: [
    { label: 'transaction(s)', count: (id) => countWhere(transactions, 'categoryId', id) },
    { label: 'wish list item(s)', count: (id) => countWhere(wishListItems, 'categoryId', id) },
    { label: 'recurring rule(s)', count: (id) => countWhere(recurringRules, 'categoryId', id) },
  ],
});

export const incomeSourceService = createConfigService({
  table: incomeSources,
  usageChecks: [
    { label: 'transaction(s)', count: (id) => countWhere(transactions, 'incomeSourceId', id) },
    { label: 'recurring rule(s)', count: (id) => countWhere(recurringRules, 'incomeSourceId', id) },
  ],
});

export const paymentMethodService = createConfigService({
  table: paymentMethods,
  usageChecks: [
    { label: 'transaction(s)', count: (id) => countWhere(transactions, 'paymentMethodId', id) },
    { label: 'recurring rule(s)', count: (id) => countWhere(recurringRules, 'paymentMethodId', id) },
  ],
});

export const tagService = createConfigService({
  table: tags,
  usageChecks: [
    { label: 'transaction(s)', count: (id) => countWhere(transactionTags, 'tagId', id) },
  ],
});
