/**
 * Deterministic recurring-rule occurrence calculation (SYSTEM_DESIGN.md §6 Recurring Rule Engine).
 * All dates are plain YYYY-MM-DD calendar dates, computed with UTC-based arithmetic only to avoid
 * DST/timezone drift — there is no time-of-day component.
 */

export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurrenceInput {
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
}

interface YMD {
  y: number;
  m: number; // 1-12
  d: number;
}

function parse(dateStr: string): YMD {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m, d };
}

function format(ymd: YMD): string {
  return `${ymd.y}-${String(ymd.m).padStart(2, '0')}-${String(ymd.d).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/**
 * Returns every occurrence date from `startDate` through `upToDate` (inclusive), bounded by
 * `endDate` (inclusive) if set. Ordered ascending.
 */
export function computeOccurrences(rule: RecurrenceInput, upToDate: string): string[] {
  const start = parse(rule.startDate);
  const results: string[] = [];
  const limit = rule.endDate && rule.endDate < upToDate ? rule.endDate : upToDate;

  if (rule.frequency === 'weekly') {
    let cursor = new Date(Date.UTC(start.y, start.m - 1, start.d));
    while (true) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (dateStr > limit) break;
      results.push(dateStr);
      cursor = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    return results;
  }

  if (rule.frequency === 'monthly') {
    for (let n = 0; ; n++) {
      const totalMonths = start.m - 1 + n;
      const y = start.y + Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;
      const d = Math.min(start.d, daysInMonth(y, m));
      const dateStr = format({ y, m, d });
      if (dateStr > limit) break;
      results.push(dateStr);
    }
    return results;
  }

  // yearly
  for (let n = 0; ; n++) {
    const y = start.y + n;
    let m = start.m;
    let d = start.d;
    if (m === 2 && d === 29 && !isLeapYear(y)) d = 28;
    const dateStr = format({ y, m, d });
    if (dateStr > limit) break;
    results.push(dateStr);
  }
  return results;
}
