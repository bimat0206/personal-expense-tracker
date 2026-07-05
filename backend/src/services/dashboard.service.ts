import { gte, lte, and, eq } from 'drizzle-orm';
import { db } from '../db/db';
import { transactions, transactionTags } from '../db/schema';
import { today } from '../lib/date';
import { getTopExpensesCount } from './settings.service';

type TxnRow = typeof transactions.$inferSelect;

interface Totals {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

function totalsOf(rows: TxnRow[]): Totals {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const r of rows) {
    if (r.type === 'income') incomeCents += r.amountCents;
    else expenseCents += r.amountCents;
  }
  return { incomeCents, expenseCents, netCents: incomeCents - expenseCents };
}

function rowsForYear(year: number): TxnRow[] {
  return db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, `${year}-01-01`), lte(transactions.date, `${year}-12-31`)))
    .all();
}

function rowsForMonth(year: number, month: number): TxnRow[] {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, `${year}-${mm}-01`), lte(transactions.date, `${year}-${mm}-${lastDay}`)))
    .all();
}

function breakdownBy(rows: TxnRow[], keyFn: (r: TxnRow) => number | null) {
  const map = new Map<number, number>();
  for (const r of rows) {
    const key = keyFn(r);
    if (key == null) continue;
    map.set(key, (map.get(key) ?? 0) + r.amountCents);
  }
  return [...map.entries()].map(([id, amountCents]) => ({ id, amountCents }));
}

function breakdownByTag(rows: TxnRow[]) {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];
  const links = db.select().from(transactionTags).all().filter((l) => ids.includes(l.transactionId));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const map = new Map<number, number>();
  for (const link of links) {
    const r = byId.get(link.transactionId);
    if (!r) continue;
    map.set(link.tagId, (map.get(link.tagId) ?? 0) + r.amountCents);
  }
  return [...map.entries()].map(([id, amountCents]) => ({ id, amountCents }));
}

function breakdowns(rows: TxnRow[]) {
  return {
    byCategory: breakdownBy(
      rows.filter((r) => r.type === 'expense'),
      (r) => r.categoryId,
    ),
    byIncomeSource: breakdownBy(
      rows.filter((r) => r.type === 'income'),
      (r) => r.incomeSourceId,
    ),
    byPaymentMethod: breakdownBy(rows, (r) => r.paymentMethodId),
    byTag: breakdownByTag(rows),
  };
}

function topExpenses(rows: TxnRow[]) {
  const limit = getTopExpensesCount();
  return rows
    .filter((r) => r.type === 'expense')
    .sort((a, b) => b.amountCents - a.amountCents || (b.date > a.date ? 1 : -1) || b.id - a.id)
    .slice(0, limit)
    .map((r) => ({ id: r.id, date: r.date, amountCents: r.amountCents, categoryId: r.categoryId, note: r.note }));
}

export function getAvailableYears() {
  const all = db.select().from(transactions).all();
  const years = new Set<number>(all.map((r) => Number(r.date.slice(0, 4))));
  years.add(new Date(today()).getFullYear());
  return {
    years: [...years]
      .sort((a, b) => a - b)
      .map((year) => {
        const rows = all.filter((r) => r.date.startsWith(String(year)));
        return { year, hasData: rows.length > 0, totals: totalsOf(rows) };
      }),
  };
}

export function getAnnual(year: number) {
  const rows = rowsForYear(year);
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthRows = rows.filter((r) => Number(r.date.slice(5, 7)) === month);
    return { month, ...totalsOf(monthRows) };
  });
  return {
    totals: totalsOf(rows),
    monthly,
    breakdowns: breakdowns(rows),
    topExpenses: topExpenses(rows),
    isPartialPeriod: year === new Date(today()).getFullYear(),
  };
}

export function getMonthly(year: number, month: number) {
  const rows = rowsForMonth(year, month);
  const now = today();
  const isPartialPeriod = year === Number(now.slice(0, 4)) && month === Number(now.slice(5, 7));
  return { totals: totalsOf(rows), breakdowns: breakdowns(rows), topExpenses: topExpenses(rows), isPartialPeriod };
}

function pctChange(baseline: number, next: number): number | null {
  if (baseline === 0) return null;
  return ((next - baseline) / baseline) * 100;
}

export function compareYears(yearA: number, yearB: number) {
  const a = getAnnual(yearA);
  const b = getAnnual(yearB);
  return {
    yearA: a,
    yearB: b,
    delta: {
      incomePct: pctChange(a.totals.incomeCents, b.totals.incomeCents),
      expensePct: pctChange(a.totals.expenseCents, b.totals.expenseCents),
      netPct: pctChange(a.totals.netCents, b.totals.netCents),
    },
  };
}
