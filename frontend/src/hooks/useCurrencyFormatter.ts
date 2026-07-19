import { useMemo } from 'react';
import { useAppSettings } from './useSettings';
import { centsToDisplay, signedCentsToDisplay, decimalToCents, centsToDecimalString, decimalAmountToCompactDisplay, getCurrencyConfig } from '../utils/currency';

export function useCurrencyFormatter() {
  const { settings, loading } = useAppSettings();
  const currencyCode = settings?.currencyCode || 'USD';

  return useMemo(() => {
    return {
      currencyCode,
      config: getCurrencyConfig(currencyCode),
      format: (cents: number) => centsToDisplay(cents, currencyCode),
      formatSigned: (cents: number, type: 'expense' | 'income') => signedCentsToDisplay(cents, type, currencyCode),
      formatCompactAmount: (amount: number) => decimalAmountToCompactDisplay(amount, currencyCode),
      parseInput: (val: string) => decimalToCents(val, currencyCode),
      toDecimalString: (cents: number) => centsToDecimalString(cents, currencyCode),
      loading,
    };
  }, [currencyCode, loading]);
}
