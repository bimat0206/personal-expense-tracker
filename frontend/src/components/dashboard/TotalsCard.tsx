import { centsToDisplay } from '../../utils/currency';

interface TotalsCardProps {
  label: string;
  valueCents: number;
  tone: 'income' | 'expense' | 'net';
  currencyCode?: string;
}

export function TotalsCard({ label, valueCents, tone, currencyCode }: TotalsCardProps) {
  return (
    <div className="glass-panel totals-card">
      <h4>{label}</h4>
      <p className={`totals-value tone-${tone}`}>{centsToDisplay(valueCents, currencyCode)}</p>
    </div>
  );
}
