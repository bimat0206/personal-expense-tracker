import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { formatAmountInput } from '../../utils/currency';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AmountInput({ value, onChange, placeholder }: AmountInputProps) {
  const { config, currencyCode, loading } = useCurrencyFormatter();
  const actualPlaceholder = placeholder || (config.multiplier === 1 ? '0' : '0.00');
  const displayValue = formatAmountInput(value, currencyCode);

  return (
    <div className="amount-input">
      <span className="amount-input-symbol">{loading ? '' : config.symbol}</span>
      <input
        type="text"
        inputMode={config.multiplier === 1 ? 'numeric' : 'decimal'}
        value={displayValue}
        placeholder={actualPlaceholder}
        onChange={(e) => onChange(formatAmountInput(e.target.value, currencyCode))}
      />
    </div>
  );
}
