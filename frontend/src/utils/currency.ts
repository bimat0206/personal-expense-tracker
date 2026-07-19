export const CURRENCIES: Record<string, { code: string; symbol: string; multiplier: number; step: string }> = {
  USD: { code: 'USD', symbol: '$', multiplier: 100, step: '0.01' },
  EUR: { code: 'EUR', symbol: '€', multiplier: 100, step: '0.01' },
  VND: { code: 'VND', symbol: '₫', multiplier: 1, step: '1000' },
};

export function getCurrencyConfig(code: string) {
  return CURRENCIES[code] || CURRENCIES.USD;
}

/** All amounts from the API are positive integer minor units (e.g. cents). */
export function centsToDisplay(cents: number, currencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: config.code }).format(cents / config.multiplier);
}

export function decimalAmountToCompactDisplay(amount: number, currencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: config.code,
    notation: 'compact',
    maximumFractionDigits: Math.abs(amount) >= 1000 ? 1 : 0,
  }).format(amount);
}

export function signedCentsToDisplay(cents: number, type: 'expense' | 'income', currencyCode = 'USD'): string {
  const formatted = centsToDisplay(cents, currencyCode);
  return type === 'expense' ? `-${formatted}` : `+${formatted}`;
}

/** Converts a decimal user-entered amount (e.g. "12.50" or "1000") to integer minor units, round-half-up. */
export function decimalToCents(value: string, currencyCode = 'USD'): number | null {
  const parsed = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const config = getCurrencyConfig(currencyCode);
  return Math.round(parsed * config.multiplier + Number.EPSILON);
}

export function centsToDecimalString(cents: number, currencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  if (config.multiplier === 1) return cents.toString();
  return (cents / config.multiplier).toFixed(Math.log10(config.multiplier));
}

export function formatAmountInput(value: string, currencyCode = 'USD'): string {
  const config = getCurrencyConfig(currencyCode);
  const withoutCommas = value.replace(/,/g, '');
  const sanitized = config.multiplier === 1
    ? withoutCommas.replace(/\D/g, '')
    : withoutCommas
      .replace(/[^\d.]/g, '')
      .replace(/(\..*)\./g, '$1');

  const [integerPart, decimalPart] = sanitized.split('.');
  const groupedInteger = integerPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (config.multiplier === 1) return groupedInteger;
  if (sanitized.includes('.')) return `${groupedInteger}.${decimalPart ?? ''}`;
  return groupedInteger;
}
