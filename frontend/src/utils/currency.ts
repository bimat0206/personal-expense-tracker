/** All amounts from the API are positive integer minor units (cents). */
export function centsToDisplay(cents: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(cents / 100);
}

export function signedCentsToDisplay(cents: number, type: 'expense' | 'income', currencyCode = 'USD'): string {
  const formatted = centsToDisplay(cents, currencyCode);
  return type === 'expense' ? `-${formatted}` : `+${formatted}`;
}

/** Converts a decimal user-entered amount (e.g. "12.50") to integer cents, round-half-up. */
export function decimalToCents(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100 + Number.EPSILON);
}

export function centsToDecimalString(cents: number): string {
  return (cents / 100).toFixed(2);
}
