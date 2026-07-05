/**
 * All amounts are stored as positive integer minor units (cents). Fixed 2 decimal places for v1
 * (SYSTEM_DESIGN.md §4.12) — no zero/three-decimal currency support.
 */

export function isValidAmountCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Round-half-up a decimal amount (e.g. from UI math) to integer cents. */
export function roundToCents(amount: number): number {
  return Math.round(amount * 100 + Number.EPSILON);
}
