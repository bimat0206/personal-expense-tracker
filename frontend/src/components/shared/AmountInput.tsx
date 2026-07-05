interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  currencyCode?: string;
  placeholder?: string;
}

const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

export function AmountInput({ value, onChange, currencyCode = 'USD', placeholder = '0.00' }: AmountInputProps) {
  return (
    <div className="amount-input">
      <span className="amount-input-symbol">{SYMBOLS[currencyCode] ?? currencyCode}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
