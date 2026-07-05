/** Backend-local system date is authoritative for all "today" comparisons (SYSTEM_DESIGN.md §4.4). */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function isFutureDate(value: string): boolean {
  return value > today();
}

export function nowIso(): string {
  return new Date().toISOString();
}
